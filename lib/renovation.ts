import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";

const renovationProjectInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  budget: z.string().trim().optional(),
});

const renovationRoomInputSchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().optional(),
  lengthM: z.string().trim().optional(),
  widthM: z.string().trim().optional(),
  heightM: z.string().trim().optional(),
});

type InvalidInput = { success: false };

export type RenovationPoint = { x: number; y: number };

export type RectangleRoomMetricInput = {
  lengthM: number;
  widthM: number;
  heightM: number;
  openingAreaM2?: number;
  coats?: number;
  paintCoverageM2PerLiter?: number;
  flooringWastePercent?: number;
};

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function round1(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function parseMetersToMillimeters(value?: string) {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 1000);
}

export function parseRenovationProjectInput(input: { title?: string; description?: string; budget?: string }) {
  const parsed = renovationProjectInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const budgetCents = parsed.data.budget ? parseEuroToCents(parsed.data.budget) : null;
  if (budgetCents !== null && budgetCents < 0) return invalid();

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    budgetCents: budgetCents && budgetCents > 0 ? budgetCents : null,
  };
}

export function parseRenovationRoomInput(input: { name?: string; category?: string; lengthM?: string; widthM?: string; heightM?: string }) {
  const parsed = renovationRoomInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  return {
    name: parsed.data.name,
    category: parsed.data.category || "Raum",
    lengthMm: parseMetersToMillimeters(parsed.data.lengthM),
    widthMm: parseMetersToMillimeters(parsed.data.widthM),
    heightMm: parseMetersToMillimeters(parsed.data.heightM),
  };
}

export function calculateRectangleRoomMetrics(input: RectangleRoomMetricInput) {
  const floorAreaM2 = round2(input.lengthM * input.widthM);
  const perimeterM = round2(2 * (input.lengthM + input.widthM));
  const grossWallAreaM2 = round2(perimeterM * input.heightM);
  const wallAreaM2 = round2(Math.max(0, grossWallAreaM2 - (input.openingAreaM2 ?? 0)));
  const coats = input.coats ?? 2;
  const paintCoverageM2PerLiter = input.paintCoverageM2PerLiter ?? 12;
  const flooringWastePercent = input.flooringWastePercent ?? 10;

  return {
    floorAreaM2,
    perimeterM,
    grossWallAreaM2,
    wallAreaM2,
    paintLiters: round1((wallAreaM2 * coats) / paintCoverageM2PerLiter),
    flooringWithWasteM2: round2(floorAreaM2 * (1 + flooringWastePercent / 100)),
    baseboardM: perimeterM,
  };
}

export function calculatePolygonAreaM2(points: RenovationPoint[]) {
  if (points.length < 3) return 0;
  const twiceArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return round2(Math.abs(twiceArea) / 2);
}

export function calculatePolygonPerimeterM(points: RenovationPoint[]) {
  if (points.length < 2) return 0;
  const perimeter = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + Math.hypot(next.x - point.x, next.y - point.y);
  }, 0);
  return round2(perimeter);
}

export function roomMetricsFromMillimeters(room: { lengthMm: number | null; widthMm: number | null; heightMm: number | null }) {
  if (!room.lengthMm || !room.widthMm || !room.heightMm) return null;
  return calculateRectangleRoomMetrics({
    lengthM: room.lengthMm / 1000,
    widthM: room.widthMm / 1000,
    heightM: room.heightMm / 1000,
  });
}

export async function getRenovationProjects() {
  const context = await requireFamilyContext();
  if (!context.family.renovationModuleEnabled) redirect("/app/settings?renovation=disabled");

  const projects = await db.renovationProject.findMany({
    where: { familyId: context.family.id },
    include: { rooms: { include: { floorPlan: { include: { markers: true } } }, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return { context, projects };
}

export async function getRenovationProjectDetail(renovationId: string) {
  const context = await requireFamilyContext();
  if (!context.family.renovationModuleEnabled) redirect("/app/settings?renovation=disabled");

  const project = await db.renovationProject.findFirst({
    where: { id: renovationId, familyId: context.family.id },
    include: { rooms: { include: { floorPlan: { include: { markers: true } } }, orderBy: { sortOrder: "asc" } } },
  });
  if (!project) redirect("/app/renovation?error=not-found");

  return { context, project };
}

export async function getRenovationRoomDetail(renovationId: string, roomId: string) {
  const { context, project } = await getRenovationProjectDetail(renovationId);
  const room = project.rooms.find((candidate) => candidate.id === roomId);
  if (!room) redirect(`/app/renovation/${renovationId}?error=room-not-found`);
  return { context, project, room };
}

export async function createRenovationProject(formData: FormData) {
  const context = await requireFamilyAdmin();
  if (!context.family.renovationModuleEnabled) redirect("/app/settings?renovation=disabled");

  const parsed = parseRenovationProjectInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    budget: formData.get("budget")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect("/app/renovation/new?error=invalid-project");

  const project = await db.renovationProject.create({
    data: {
      familyId: context.family.id,
      title: parsed.title,
      description: parsed.description || null,
      budgetCents: parsed.budgetCents,
      status: "ACTIVE",
      createdByUserId: context.user.id,
    },
  });

  return project.id;
}

export async function createRenovationRoom(renovationId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  if (!context.family.renovationModuleEnabled) redirect("/app/settings?renovation=disabled");

  const project = await db.renovationProject.findFirst({ where: { id: renovationId, familyId: context.family.id }, select: { id: true } });
  if (!project) redirect("/app/renovation?error=not-found");

  const parsed = parseRenovationRoomInput({
    name: formData.get("name")?.toString(),
    category: formData.get("category")?.toString(),
    lengthM: formData.get("lengthM")?.toString(),
    widthM: formData.get("widthM")?.toString(),
    heightM: formData.get("heightM")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect(`/app/renovation/${renovationId}?error=invalid-room`);

  const sortOrder = await db.renovationRoom.count({ where: { renovationProjectId: project.id } });
  const room = await db.renovationRoom.create({
    data: {
      familyId: context.family.id,
      renovationProjectId: project.id,
      name: parsed.name,
      category: parsed.category,
      lengthMm: parsed.lengthMm,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
      sortOrder: sortOrder * 10,
      floorPlan: { create: { shapeType: "RECTANGLE" } },
    },
  });

  return room.id;
}
