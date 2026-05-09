import assert from "node:assert/strict";
import test from "node:test";
import { buildChessPlayerOptions, normalizeCompetitionPlayerName, CHESS_RESULT_OPTIONS } from "../lib/chess-competition";

test("normalizeCompetitionPlayerName trims whitespace and limits length", () => {
  assert.equal(normalizeCompetitionPlayerName("  Oma   Inge  "), "Oma Inge");
  assert.equal(normalizeCompetitionPlayerName("x".repeat(100)).length, 80);
});

test("buildChessPlayerOptions keeps family and competition players separate", () => {
  const options = buildChessPlayerOptions(
    [{ id: "m1", name: "Vale" }],
    [{ id: "p1", name: "Gast" }],
  );

  assert.deepEqual(options, [
    { id: "competition:p1", name: "Gast", source: "competition" },
    { id: "family:m1", name: "Vale", source: "family" },
  ]);
});

test("chess result options include all requested outcomes", () => {
  assert.deepEqual(CHESS_RESULT_OPTIONS.map((option) => option.label), [
    "Weiß gewonnen",
    "Schwarz gewonnen",
    "Remis",
    "abgebrochen / nicht gewertet",
  ]);
});
