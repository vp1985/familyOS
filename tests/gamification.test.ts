import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePointBalance,
  parseBadgeAssignmentInput,
  parsePointTransactionInput,
  parseRewardInput,
  parseRewardRedemptionInput,
} from "../lib/gamification";

test("parsePointTransactionInput normalizes member, reason and signed points", () => {
  assert.deepEqual(parsePointTransactionInput({ familyMemberId: "mia", reason: "  Zimmer aufgeräumt  ", points: "15" }), {
    familyMemberId: "mia",
    reason: "Zimmer aufgeräumt",
    points: 15,
  });
  assert.deepEqual(parsePointTransactionInput({ familyMemberId: "mia", reason: "Regelverstoß", points: "-5" }), {
    familyMemberId: "mia",
    reason: "Regelverstoß",
    points: -5,
  });
  assert.deepEqual(parsePointTransactionInput({ familyMemberId: "", reason: "ok", points: "1" }), { success: false });
  assert.deepEqual(parsePointTransactionInput({ familyMemberId: "mia", reason: "", points: "1" }), { success: false });
  assert.deepEqual(parsePointTransactionInput({ familyMemberId: "mia", reason: "ok", points: "0" }), { success: false });
});

test("calculatePointBalance sums positive and negative transactions", () => {
  assert.equal(calculatePointBalance([{ points: 10 }, { points: -3 }, { points: 7 }]), 14);
});

test("parseRewardInput trims reward fields and requires positive point cost", () => {
  assert.deepEqual(parseRewardInput({ title: "  Filmabend ", description: "  Samstag ", costPoints: "30" }), {
    title: "Filmabend",
    description: "Samstag",
    costPoints: 30,
  });
  assert.deepEqual(parseRewardInput({ title: "", costPoints: "30" }), { success: false });
  assert.deepEqual(parseRewardInput({ title: "Filmabend", costPoints: "0" }), { success: false });
});

test("parseRewardRedemptionInput requires reward and member", () => {
  assert.deepEqual(parseRewardRedemptionInput({ rewardId: "reward-1", familyMemberId: "mia" }), {
    rewardId: "reward-1",
    familyMemberId: "mia",
  });
  assert.deepEqual(parseRewardRedemptionInput({ rewardId: "", familyMemberId: "mia" }), { success: false });
  assert.deepEqual(parseRewardRedemptionInput({ rewardId: "reward-1", familyMemberId: "" }), { success: false });
});

test("parseBadgeAssignmentInput trims badge fields and requires member", () => {
  assert.deepEqual(parseBadgeAssignmentInput({ familyMemberId: "mia", title: "  Mutig ", icon: " 🦁 ", description: "  Hilfe geholt " }), {
    familyMemberId: "mia",
    title: "Mutig",
    icon: "🦁",
    description: "Hilfe geholt",
  });
  assert.deepEqual(parseBadgeAssignmentInput({ familyMemberId: "mia", title: "Mutig" }), {
    familyMemberId: "mia",
    title: "Mutig",
    icon: "🏅",
    description: "",
  });
  assert.deepEqual(parseBadgeAssignmentInput({ familyMemberId: "", title: "Mutig" }), { success: false });
  assert.deepEqual(parseBadgeAssignmentInput({ familyMemberId: "mia", title: "" }), { success: false });
});
