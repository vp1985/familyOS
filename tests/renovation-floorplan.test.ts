import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateRectangleRoomMetrics,
  calculatePolygonAreaM2,
  calculatePolygonPerimeterM,
  parseRenovationProjectInput,
} from "../lib/renovation";

test("parseRenovationProjectInput trims project fields and parses optional budget", () => {
  assert.deepEqual(parseRenovationProjectInput({ title: "  Kinderzimmer  ", description: "  Streichen ", budget: "1200,50" }), {
    title: "Kinderzimmer",
    description: "Streichen",
    budgetCents: 120050,
  });

  assert.deepEqual(parseRenovationProjectInput({ title: "", budget: "10" }), { success: false });
  assert.deepEqual(parseRenovationProjectInput({ title: "Bad", budget: "0" }), { title: "Bad", description: "", budgetCents: null });
});

test("calculateRectangleRoomMetrics derives renovation material quantities", () => {
  assert.deepEqual(calculateRectangleRoomMetrics({ lengthM: 5.2, widthM: 3.5, heightM: 2.5, openingAreaM2: 2.4, coats: 2 }), {
    floorAreaM2: 18.2,
    perimeterM: 17.4,
    grossWallAreaM2: 43.5,
    wallAreaM2: 41.1,
    paintLiters: 6.9,
    flooringWithWasteM2: 20.02,
    baseboardM: 17.4,
  });
});

test("polygon helpers calculate L-shaped room area and perimeter", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 5.2, y: 0 },
    { x: 5.2, y: 2.1 },
    { x: 3.4, y: 2.1 },
    { x: 3.4, y: 4 },
    { x: 0, y: 4 },
  ];

  assert.equal(calculatePolygonAreaM2(points), 17.38);
  assert.equal(calculatePolygonPerimeterM(points), 18.4);
});

test("renovation module has gated navigation, settings toggle and floorplan route", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const bottomNav = readFileSync("components/layout/bottom-nav.tsx", "utf8");
  const settingsPage = readFileSync("app/app/settings/page.tsx", "utf8");
  const roomPage = readFileSync("app/app/renovation/[renovationId]/rooms/[roomId]/page.tsx", "utf8");

  assert.match(schema, /renovationModuleEnabled\s+Boolean\s+@default\(false\)/);
  assert.match(bottomNav, /renovationModuleEnabled/);
  assert.match(bottomNav, /\/app\/renovation/);
  assert.match(settingsPage, /Renovierungsmodul aktivieren/);
  assert.match(roomPage, /FloorPlanSvg/);
});
