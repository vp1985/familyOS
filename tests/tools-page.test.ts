import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("tools route exposes stopwatch and chess clock with common presets", () => {
  const page = readFileSync("app/app/tools/page.tsx", "utf8");
  const stopwatch = readFileSync("components/tools/stopwatch.tsx", "utf8");
  const chessClock = readFileSync("components/tools/chess-clock.tsx", "utf8");
  const nav = readFileSync("components/layout/bottom-nav.tsx", "utf8");
  const dashboard = readFileSync("app/app/page.tsx", "utf8");

  assert.match(page, /Werkzeuge/);
  assert.match(page, /Stoppuhr/);
  assert.match(page, /Schachuhr/);
  assert.match(page, /Stopwatch/);
  assert.match(page, /ChessClock/);

  assert.match(stopwatch, /use client/);
  assert.match(stopwatch, /Start/);
  assert.match(stopwatch, /Pause/);
  assert.match(stopwatch, /Reset/);
  assert.match(stopwatch, /Runde/);

  for (const preset of ["1+0", "2+1", "3+0", "3+2", "5+0", "5+3", "10+0", "10+5", "15+10", "30+0"]) {
    assert.match(chessClock, new RegExp(preset.replace("+", "\\+")));
  }
  assert.match(chessClock, /Weiß/);
  assert.match(chessClock, /Schwarz/);
  assert.match(chessClock, /Inkrement/);
  assert.match(chessClock, /Date\.now/);
  assert.match(chessClock, /setClockOpen\(true\)/);
  assert.match(chessClock, /otherSide\(side\)/);
  assert.match(chessClock, /Uhr starten/);
  assert.match(chessClock, /gameActive \? \(/);
  assert.match(chessClock, /fixed inset-0 z-50/);
  assert.match(chessClock, /Timer zurücksetzen/);
  assert.match(chessClock, /Weiterspielen/);
  assert.match(chessClock, /navigator\.vibrate/);
  assert.match(chessClock, /AudioContext/);
  assert.match(chessClock, /playClockFeedback\("invalid"\)/);
  assert.match(chessClock, /oscillator\.type = kind === "valid" \? "square" : "sawtooth"/);

  assert.match(nav, /\/app\/tools/);
  assert.match(nav, /Tools/);
  assert.match(dashboard, /\/app\/tools/);
});
