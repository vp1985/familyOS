import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";

export const relationshipTypes = ["FRIEND", "FAMILY", "NEIGHBOR", "SCHOOL_CLUB", "OTHER"] as const;
export const preferenceCategories = ["DRINK", "FOOD", "HOBBY", "GIFT_IDEA", "ALLERGY", "MEDICAL_NOTE", "OTHER"] as const;
export const preferenceSentiments = ["LIKES", "DISLIKES", "NOTE"] as const;
export const giftOccasions = ["BIRTHDAY", "CHRISTMAS", "EASTER", "SCHOOL", "OTHER"] as const;
export const giftListVisibilities = ["FAMILY_INTERNAL", "ORGANIZERS_ONLY", "HIDDEN_FROM_CHILDREN"] as const;
export const giftStatuses = ["IDEA", "WANTED", "RESERVED", "BOUGHT", "DONE"] as const;

export type RelationshipTypeValue = (typeof relationshipTypes)[number];
export type PreferenceCategoryValue = (typeof preferenceCategories)[number];
export type PreferenceSentimentValue = (typeof preferenceSentiments)[number];
export type GiftOccasionValue = (typeof giftOccasions)[number];
export type GiftListVisibilityValue = (typeof giftListVisibilities)[number];
export type GiftStatusValue = (typeof giftStatuses)[number];

type InvalidInput = { success: false };

const relationshipContactInputSchema = z.object({
  name: z.string().trim().min(2),
  relationshipType: z.enum(relationshipTypes).optional().or(z.literal("")),
  relatedFamilyMemberId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const relationshipPreferenceInputSchema = z.object({
  contactId: z.string().trim().min(1),
  category: z.enum(preferenceCategories),
  label: z.string().trim().min(2),
  sentiment: z.enum(preferenceSentiments).optional().or(z.literal("")),
  isFavorite: z.string().optional(),
  notes: z.string().trim().optional(),
});

const giftListInputSchema = z.object({
  contactId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  occasion: z.enum(giftOccasions).optional().or(z.literal("")),
  eventDate: z.string().trim().optional(),
  visibility: z.enum(giftListVisibilities).optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

const giftIdeaInputSchema = z.object({
  giftListId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  url: z.string().trim().optional(),
  estimatedPrice: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  status: z.enum(giftStatuses).optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

export type ParsedRelationshipContactInput = {
  name: string;
  relationshipType: RelationshipTypeValue;
  relatedFamilyMemberId: string | null;
  notes: string;
};

export type ParsedRelationshipPreferenceInput = {
  contactId: string;
  category: PreferenceCategoryValue;
  label: string;
  sentiment: PreferenceSentimentValue;
  isFavorite: boolean;
  notes: string;
};

export type ParsedGiftListInput = {
  contactId: string;
  title: string;
  occasion: GiftOccasionValue;
  eventDate: Date | null;
  visibility: GiftListVisibilityValue;
  notes: string;
};

export type ParsedGiftIdeaInput = {
  giftListId: string;
  title: string;
  url: string;
  estimatedPriceCents: number | null;
  priority: number;
  status: GiftStatusValue;
  notes: string;
};

export type PreferenceChip = {
  category: PreferenceCategoryValue;
  label: string;
  sentiment: PreferenceSentimentValue;
  isFavorite: boolean;
  tone: "warning" | "favorite" | "muted" | "normal";
};

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function parseUtcDate(date?: string) {
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;
  return value;
}

export function parseRelationshipContactInput(input: {
  name?: string;
  relationshipType?: string;
  relatedFamilyMemberId?: string;
  notes?: string;
}): ParsedRelationshipContactInput | InvalidInput {
  const parsed = relationshipContactInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  return {
    name: parsed.data.name,
    relationshipType: (parsed.data.relationshipType || "FRIEND") as RelationshipTypeValue,
    relatedFamilyMemberId: parsed.data.relatedFamilyMemberId?.trim() || null,
    notes: parsed.data.notes ?? "",
  };
}

export function parseRelationshipPreferenceInput(input: {
  contactId?: string;
  category?: string;
  label?: string;
  sentiment?: string;
  isFavorite?: string;
  notes?: string;
}): ParsedRelationshipPreferenceInput | InvalidInput {
  const parsed = relationshipPreferenceInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const category = parsed.data.category;
  const safetyHint = category === "ALLERGY" || category === "MEDICAL_NOTE";

  return {
    contactId: parsed.data.contactId,
    category,
    label: parsed.data.label,
    sentiment: safetyHint ? "NOTE" : ((parsed.data.sentiment || "NOTE") as PreferenceSentimentValue),
    isFavorite: parsed.data.isFavorite === "on",
    notes: parsed.data.notes ?? "",
  };
}

export function parseGiftListInput(input: {
  contactId?: string;
  title?: string;
  occasion?: string;
  eventDate?: string;
  visibility?: string;
  notes?: string;
}): ParsedGiftListInput | InvalidInput {
  const parsed = giftListInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const eventDate = parsed.data.eventDate ? parseUtcDate(parsed.data.eventDate) : null;
  if (parsed.data.eventDate && !eventDate) return invalid();

  return {
    contactId: parsed.data.contactId,
    title: parsed.data.title,
    occasion: (parsed.data.occasion || "OTHER") as GiftOccasionValue,
    eventDate,
    visibility: (parsed.data.visibility || "FAMILY_INTERNAL") as GiftListVisibilityValue,
    notes: parsed.data.notes ?? "",
  };
}

export function parseGiftIdeaInput(input: {
  giftListId?: string;
  title?: string;
  url?: string;
  estimatedPrice?: string;
  priority?: string;
  status?: string;
  notes?: string;
}): ParsedGiftIdeaInput | InvalidInput {
  const parsed = giftIdeaInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const priceText = parsed.data.estimatedPrice ?? "";
  const estimatedPriceCents = priceText ? parseEuroToCents(priceText) : null;
  if (priceText && (estimatedPriceCents === null || estimatedPriceCents < 0)) return invalid();

  const priority = parsed.data.priority ? Number.parseInt(parsed.data.priority, 10) : 3;
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) return invalid();

  const url = parsed.data.url ?? "";
  if (url && !/^https?:\/\//.test(url)) return invalid();

  return {
    giftListId: parsed.data.giftListId,
    title: parsed.data.title,
    url,
    estimatedPriceCents,
    priority,
    status: (parsed.data.status || "IDEA") as GiftStatusValue,
    notes: parsed.data.notes ?? "",
  };
}

export function buildPreferenceChips(preferences: Array<{
  category: PreferenceCategoryValue | string;
  label: string;
  sentiment: PreferenceSentimentValue | string;
  isFavorite: boolean;
}>): PreferenceChip[] {
  return preferences
    .filter((preference) => preference.label.trim().length > 0)
    .map((preference) => {
      const category = preference.category as PreferenceCategoryValue;
      const sentiment = preference.sentiment as PreferenceSentimentValue;
      const tone: PreferenceChip["tone"] =
        category === "ALLERGY" || category === "MEDICAL_NOTE" ? "warning" : preference.isFavorite ? "favorite" : sentiment === "DISLIKES" ? "muted" : "normal";
      return { category, label: preference.label.trim(), sentiment, isFavorite: preference.isFavorite, tone };
    })
    .sort((a, b) => chipRank(a) - chipRank(b) || a.label.localeCompare(b.label, "de"));
}

function chipRank(chip: PreferenceChip) {
  if (chip.tone === "warning") return 0;
  if (chip.tone === "favorite") return 1;
  if (chip.tone === "normal") return 2;
  return 3;
}

export function relationshipTypeLabel(type: RelationshipTypeValue | string) {
  const labels: Record<RelationshipTypeValue, string> = {
    FRIEND: "Freund/in",
    FAMILY: "Familie",
    NEIGHBOR: "Nachbar/in",
    SCHOOL_CLUB: "Schule/Verein",
    OTHER: "Sonstiges",
  };
  return labels[type as RelationshipTypeValue] ?? "Sonstiges";
}

export function preferenceCategoryLabel(category: PreferenceCategoryValue | string) {
  const labels: Record<PreferenceCategoryValue, string> = {
    DRINK: "Getränke",
    FOOD: "Essen/Snacks",
    HOBBY: "Hobbys",
    GIFT_IDEA: "Geschenkideen",
    ALLERGY: "Allergien",
    MEDICAL_NOTE: "Medizinische Hinweise",
    OTHER: "Sonstiges",
  };
  return labels[category as PreferenceCategoryValue] ?? "Sonstiges";
}

export function giftOccasionLabel(occasion: GiftOccasionValue | string) {
  const labels: Record<GiftOccasionValue, string> = {
    BIRTHDAY: "Geburtstag",
    CHRISTMAS: "Weihnachten",
    EASTER: "Ostern",
    SCHOOL: "Einschulung/Schule",
    OTHER: "Sonstiges",
  };
  return labels[occasion as GiftOccasionValue] ?? "Sonstiges";
}

export function giftStatusLabel(status: GiftStatusValue | string) {
  const labels: Record<GiftStatusValue, string> = {
    IDEA: "Idee",
    WANTED: "gewünscht",
    RESERVED: "reserviert",
    BOUGHT: "gekauft",
    DONE: "erledigt",
  };
  return labels[status as GiftStatusValue] ?? "Idee";
}

export function giftListVisibilityLabel(visibility: GiftListVisibilityValue | string) {
  const labels: Record<GiftListVisibilityValue, string> = {
    FAMILY_INTERNAL: "familienintern",
    ORGANIZERS_ONLY: "nur Organisation",
    HIDDEN_FROM_CHILDREN: "vor Kindern verborgen",
  };
  return labels[visibility as GiftListVisibilityValue] ?? "familienintern";
}

export async function getRelationshipsPageData() {
  const context = await requireFamilyContext();
  const [members, contacts] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.relationshipContact.findMany({
      where: { familyId: context.family.id },
      include: {
        relatedFamilyMember: true,
        preferences: { orderBy: [{ category: "asc" }, { isFavorite: "desc" }, { label: "asc" }] },
        giftLists: { include: { giftIdeas: { orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }] } }, orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }] },
      },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return { context, members, contacts };
}

export async function createRelationshipContact(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRelationshipContactInput({
    name: formData.get("name")?.toString(),
    relationshipType: formData.get("relationshipType")?.toString(),
    relatedFamilyMemberId: formData.get("relatedFamilyMemberId")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/relationships?error=invalid-contact");

  if (parsed.relatedFamilyMemberId) {
    const member = await db.familyMember.findFirst({ where: { id: parsed.relatedFamilyMemberId, familyId: context.family.id } });
    if (!member) redirect("/app/relationships?error=invalid-member");
  }

  await db.relationshipContact.create({
    data: {
      familyId: context.family.id,
      name: parsed.name,
      relationshipType: parsed.relationshipType,
      relatedFamilyMemberId: parsed.relatedFamilyMemberId,
      notes: parsed.notes || null,
      createdByUserId: context.user.id,
    },
  });
}

export async function createRelationshipPreference(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRelationshipPreferenceInput({
    contactId: formData.get("contactId")?.toString(),
    category: formData.get("category")?.toString(),
    label: formData.get("label")?.toString(),
    sentiment: formData.get("sentiment")?.toString(),
    isFavorite: formData.get("isFavorite")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/relationships?error=invalid-preference");

  const contact = await db.relationshipContact.findFirst({ where: { id: parsed.contactId, familyId: context.family.id } });
  if (!contact) redirect("/app/relationships?error=invalid-contact-ref");

  await db.relationshipPreference.create({
    data: {
      familyId: context.family.id,
      contactId: parsed.contactId,
      category: parsed.category,
      label: parsed.label,
      sentiment: parsed.sentiment,
      isFavorite: parsed.isFavorite,
      notes: parsed.notes || null,
    },
  });
}

export async function createRelationshipGiftList(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseGiftListInput({
    contactId: formData.get("contactId")?.toString(),
    title: formData.get("title")?.toString(),
    occasion: formData.get("occasion")?.toString(),
    eventDate: formData.get("eventDate")?.toString(),
    visibility: formData.get("visibility")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/relationships?error=invalid-gift-list");

  const contact = await db.relationshipContact.findFirst({ where: { id: parsed.contactId, familyId: context.family.id } });
  if (!contact) redirect("/app/relationships?error=invalid-contact-ref");

  await db.relationshipGiftList.create({
    data: {
      familyId: context.family.id,
      contactId: parsed.contactId,
      title: parsed.title,
      occasion: parsed.occasion,
      eventDate: parsed.eventDate,
      visibility: parsed.visibility,
      notes: parsed.notes || null,
    },
  });
}

export async function createRelationshipGiftIdea(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseGiftIdeaInput({
    giftListId: formData.get("giftListId")?.toString(),
    title: formData.get("title")?.toString(),
    url: formData.get("url")?.toString(),
    estimatedPrice: formData.get("estimatedPrice")?.toString(),
    priority: formData.get("priority")?.toString(),
    status: formData.get("status")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/relationships?error=invalid-gift-idea");

  const giftList = await db.relationshipGiftList.findFirst({ where: { id: parsed.giftListId, familyId: context.family.id } });
  if (!giftList) redirect("/app/relationships?error=invalid-gift-list-ref");

  await db.relationshipGiftIdea.create({
    data: {
      familyId: context.family.id,
      giftListId: parsed.giftListId,
      title: parsed.title,
      url: parsed.url || null,
      estimatedPriceCents: parsed.estimatedPriceCents,
      priority: parsed.priority,
      status: parsed.status,
      notes: parsed.notes || null,
      createdByUserId: context.user.id,
    },
  });
}
