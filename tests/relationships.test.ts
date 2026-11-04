import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildPreferenceChips,
  giftOccasionLabel,
  giftStatusLabel,
  parseGiftIdeaInput,
  parseGiftListInput,
  parseRelationshipContactInput,
  parseRelationshipPreferenceInput,
} from "../lib/relationships";

test("parseRelationshipContactInput normalisiert Beziehungspersonen", () => {
  assert.deepEqual(parseRelationshipContactInput({ name: "  Max Müller  ", relationshipType: "FRIEND", relatedFamilyMemberId: " kid-1 ", notes: "  Schulfreund  " }), {
    name: "Max Müller",
    relationshipType: "FRIEND",
    relatedFamilyMemberId: "kid-1",
    notes: "Schulfreund",
  });

  assert.deepEqual(parseRelationshipContactInput({ name: "M", relationshipType: "FRIEND" }), { success: false });
  assert.deepEqual(parseRelationshipContactInput({ name: "Max", relationshipType: "CRM" }), { success: false });
});

test("parseRelationshipPreferenceInput trennt Vorlieben von Allergien und medizinischen Hinweisen", () => {
  assert.deepEqual(parseRelationshipPreferenceInput({ contactId: "c1", category: "DRINK", label: "  Krombacher  ", sentiment: "LIKES", isFavorite: "on", notes: " kalt " }), {
    contactId: "c1",
    category: "DRINK",
    label: "Krombacher",
    sentiment: "LIKES",
    isFavorite: true,
    notes: "kalt",
  });

  assert.deepEqual(parseRelationshipPreferenceInput({ contactId: "c1", category: "ALLERGY", label: "  Erdnüsse  ", sentiment: "LIKES" }), {
    contactId: "c1",
    category: "ALLERGY",
    label: "Erdnüsse",
    sentiment: "NOTE",
    isFavorite: false,
    notes: "",
  });

  assert.deepEqual(parseRelationshipPreferenceInput({ contactId: "", category: "DRINK", label: "Cola", sentiment: "LIKES" }), { success: false });
  assert.deepEqual(parseRelationshipPreferenceInput({ contactId: "c1", category: "DRINK", label: "", sentiment: "LIKES" }), { success: false });
});

test("parseGiftListInput und parseGiftIdeaInput normalisieren Geschenklisten", () => {
  assert.deepEqual(parseGiftListInput({ contactId: "c1", title: "  Geburtstag 2026  ", occasion: "BIRTHDAY", eventDate: "2026-08-05", visibility: "HIDDEN_FROM_CHILDREN", notes: "  geheim  " }), {
    contactId: "c1",
    title: "Geburtstag 2026",
    occasion: "BIRTHDAY",
    eventDate: new Date("2026-08-05T00:00:00.000Z"),
    visibility: "HIDDEN_FROM_CHILDREN",
    notes: "geheim",
  });

  assert.deepEqual(parseGiftIdeaInput({ giftListId: "g1", title: "  Lego Set  ", url: " https://example.com/lego ", estimatedPrice: "29,99", priority: "2", status: "WANTED", notes: "  blau  " }), {
    giftListId: "g1",
    title: "Lego Set",
    url: "https://example.com/lego",
    estimatedPriceCents: 2999,
    priority: 2,
    status: "WANTED",
    notes: "blau",
  });

  assert.deepEqual(parseGiftListInput({ contactId: "c1", title: "X", occasion: "BIRTHDAY" }), { success: false });
  assert.deepEqual(parseGiftIdeaInput({ giftListId: "g1", title: "Puppe", estimatedPrice: "-1" }), { success: false });
});

test("buildPreferenceChips sortiert Sicherheits-Hinweise vor normalen Vorlieben", () => {
  const chips = buildPreferenceChips([
    { category: "DRINK", label: "Spezi", sentiment: "LIKES", isFavorite: false },
    { category: "ALLERGY", label: "Erdnüsse", sentiment: "NOTE", isFavorite: false },
    { category: "DRINK", label: "Krombacher", sentiment: "LIKES", isFavorite: true },
  ]);

  assert.deepEqual(chips.map((chip) => chip.label), ["Erdnüsse", "Krombacher", "Spezi"]);
  assert.equal(chips[0].tone, "warning");
  assert.equal(chips[1].tone, "favorite");
});

test("Beziehungen-Route, Actions und Navigation sind verdrahtet", () => {
  const page = readFileSync("app/app/relationships/page.tsx", "utf8");
  const actions = readFileSync("app/app/relationships/actions.ts", "utf8");
  const nav = readFileSync("components/layout/bottom-nav.tsx", "utf8");

  assert.match(page, /Beziehungen/);
  assert.match(page, /Geschenklisten/);
  assert.match(page, /Allergien/);
  assert.match(actions, /createRelationshipContactAction/);
  assert.match(actions, /createRelationshipPreferenceAction/);
  assert.match(actions, /createRelationshipGiftListAction/);
  assert.match(actions, /createRelationshipGiftIdeaAction/);
  assert.match(nav, /\/app\/relationships/);
  assert.match(nav, /Beziehungen/);

  assert.equal(giftOccasionLabel("CHRISTMAS"), "Weihnachten");
  assert.equal(giftStatusLabel("RESERVED"), "reserviert");
});
