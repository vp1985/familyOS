import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_ACCOUNTING_CENTS,
  MAX_ACCOUNTING_ELAPSED_MS,
  canApplyTaskTimeAction,
  elapsedWorkedMs,
  expectedAmountCents,
  isTimerWarningReached,
  parseTaskCompensationConfig,
  type TaskPayMode,
  type TaskTimeSource,
  type TaskTimeStatus,
  type TaskWorkEntry,
} from "../lib/task-time";

const startedAt = new Date("2026-05-11T10:00:00.000Z");

const noCompensation = {
  mode: "NONE",
  expectedChildDurationMinutes: null,
  timerWarningMinutes: null,
} as const;

function runningEntry(overrides: Partial<TaskWorkEntry> = {}): TaskWorkEntry {
  return {
    id: "entry-1",
    taskOccurrenceId: "occurrence-1",
    status: "RUNNING",
    source: "TIMER",
    startedAt,
    endedAt: null,
    pauses: [],
    compensationConfig: noCompensation,
    ...overrides,
  };
}

test("public TaskTime aliases remain available", () => {
  const mode: TaskPayMode = "NONE";
  const status: TaskTimeStatus = "RUNNING";
  const source: TaskTimeSource = "TIMER";
  assert.deepEqual([mode, status, source], ["NONE", "RUNNING", "TIMER"]);
});

test("parseTaskCompensationConfig accepts no compensation and nullable duration settings", () => {
  assert.deepEqual(
    parseTaskCompensationConfig({
      mode: "NONE",
      expectedChildDurationMinutes: " ",
      timerWarningMinutes: null,
    }),
    noCompensation,
  );
});

test("parseTaskCompensationConfig rejects malformed top-level input without throwing", () => {
  for (const input of [null, undefined, true, 42, "compensation", Symbol("compensation"), []] as const) {
    assert.deepEqual(parseTaskCompensationConfig(input), { success: false });
  }
});

test("parseTaskCompensationConfig rejects inherited mode and hostile object property access", () => {
  assert.deepEqual(parseTaskCompensationConfig(Object.create({ mode: "NONE" })), { success: false });

  const throwingModeGetter = Object.defineProperty({}, "mode", {
    enumerable: true,
    get() {
      throw new Error("hostile mode getter");
    },
  });
  assert.deepEqual(parseTaskCompensationConfig(throwingModeGetter), { success: false });

  const throwingProxy = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        throw new Error("hostile proxy");
      },
    },
  );
  assert.deepEqual(parseTaskCompensationConfig(throwingProxy), { success: false });
});

test("parseTaskCompensationConfig normalizes blank alternate amounts before exclusivity validation", () => {
  assert.deepEqual(
    parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "250", hourlyRateCents: "  " }),
    { mode: "FIXED_AMOUNT", fixedAmountCents: 250, expectedChildDurationMinutes: null, timerWarningMinutes: null },
  );
  assert.deepEqual(
    parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "800", fixedAmountCents: undefined }),
    { mode: "HOURLY_RATE", hourlyRateCents: 800, expectedChildDurationMinutes: null, timerWarningMinutes: null },
  );
  assert.deepEqual(
    parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "250", hourlyRateCents: "800" }), {
    success: false,
  });
  assert.deepEqual(
    parseTaskCompensationConfig({ mode: "HOURLY_RATE", fixedAmountCents: "250", hourlyRateCents: "800" }), {
    success: false,
  });
});

test("parseTaskCompensationConfig requires exactly one selected amount rule", () => {
  assert.deepEqual(
    parseTaskCompensationConfig({
      mode: "FIXED_AMOUNT",
      fixedAmountCents: "250",
      expectedChildDurationMinutes: "30",
      timerWarningMinutes: "15",
    }),
    {
      mode: "FIXED_AMOUNT",
      fixedAmountCents: 250,
      expectedChildDurationMinutes: 30,
      timerWarningMinutes: 15,
    },
  );
  assert.deepEqual(parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "800" }), {
    mode: "HOURLY_RATE",
    hourlyRateCents: 800,
    expectedChildDurationMinutes: null,
    timerWarningMinutes: null,
  });
  assert.deepEqual(parseTaskCompensationConfig({ mode: "NONE", fixedAmountCents: "1" }), { success: false });
});

test("parseTaskCompensationConfig rejects non-positive, non-integral, and impractical duration settings", () => {
  assert.deepEqual(parseTaskCompensationConfig({ mode: "NONE", expectedChildDurationMinutes: "0" }), { success: false });
  assert.deepEqual(parseTaskCompensationConfig({ mode: "NONE", timerWarningMinutes: "1.5" }), { success: false });
  assert.deepEqual(parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "0" }), { success: false });
  assert.deepEqual(parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "800.5" }), { success: false });
  assert.deepEqual(
    parseTaskCompensationConfig({ mode: "NONE", timerWarningMinutes: String(MAX_ACCOUNTING_ELAPSED_MS / 60_000 + 1) }),
    { success: false },
  );
});

test("elapsedWorkedMs derives work only from durable timestamps and excludes completed pauses", () => {
  const entry = runningEntry({
    pauses: [{ startedAt: new Date("2026-05-11T10:10:00.000Z"), endedAt: new Date("2026-05-11T10:20:00.000Z") }],
  });

  assert.equal(elapsedWorkedMs(entry, new Date("2026-05-11T10:45:00.000Z")), 2_100_000);
  assert.equal(
    elapsedWorkedMs(
      runningEntry({ status: "COMPLETED", endedAt: new Date("2026-05-11T10:45:00.000Z"), pauses: entry.pauses }),
      new Date("2026-05-11T11:00:00.000Z"),
    ),
    2_100_000,
  );
});

test("contradictory open-pause states cannot accrue elapsed time, compensation, or warnings", () => {
  const hourlyConfig = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "6000", timerWarningMinutes: "1" });
  const fixedConfig = parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "250", timerWarningMinutes: "1" });
  assert.equal("success" in hourlyConfig, false);
  assert.equal("success" in fixedConfig, false);
  if ("success" in hourlyConfig || "success" in fixedConfig) return;

  const now = new Date("2026-05-11T11:00:00.000Z");
  const openPause = { startedAt: new Date("2026-05-11T10:30:00.000Z"), endedAt: null };
  const contradictoryEntries = [
    runningEntry({ compensationConfig: hourlyConfig, pauses: [openPause] }),
    runningEntry({
      compensationConfig: fixedConfig,
      status: "COMPLETED",
      endedAt: new Date("2026-05-11T10:45:00.000Z"),
      pauses: [openPause],
    }),
    runningEntry({
      compensationConfig: fixedConfig,
      status: "CANCELLED",
      endedAt: new Date("2026-05-11T10:45:00.000Z"),
      pauses: [openPause],
    }),
  ];

  for (const entry of contradictoryEntries) {
    assert.equal(elapsedWorkedMs(entry, now), 0);
    assert.equal(expectedAmountCents(entry, now), 0);
    assert.equal(isTimerWarningReached(entry, now), false);
  }
});

test("elapsedWorkedMs ignores malformed, reversed, and out-of-bounds pauses", () => {
  const entry = runningEntry({
    pauses: [
      { startedAt: new Date("invalid"), endedAt: new Date("2026-05-11T10:15:00.000Z") },
      { startedAt: new Date("2026-05-11T10:20:00.000Z"), endedAt: new Date("2026-05-11T10:10:00.000Z") },
      { startedAt: new Date("2026-05-11T09:00:00.000Z"), endedAt: new Date("2026-05-11T09:30:00.000Z") },
    ],
  });
  assert.equal(elapsedWorkedMs(entry, new Date("2026-05-11T10:30:00.000Z")), 1_800_000);
  assert.equal(elapsedWorkedMs(runningEntry({ startedAt: new Date("invalid") }), new Date("2026-05-11T10:30:00.000Z")), 0);
  assert.equal(elapsedWorkedMs(runningEntry(), new Date("invalid")), 0);
});

test("elapsedWorkedMs does not double-subtract overlapping persisted pauses", () => {
  const entry = runningEntry({
    pauses: [
      { startedAt: new Date("2026-05-11T10:10:00.000Z"), endedAt: new Date("2026-05-11T10:25:00.000Z") },
      { startedAt: new Date("2026-05-11T10:20:00.000Z"), endedAt: new Date("2026-05-11T10:30:00.000Z") },
    ],
  });
  assert.equal(elapsedWorkedMs(entry, new Date("2026-05-11T10:40:00.000Z")), 1_200_000);
});

test("zero-duration terminal entries preserve fixed compensation and yield zero hourly compensation", () => {
  const fixedConfig = parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "250" });
  const hourlyConfig = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "6000" });
  assert.equal("success" in fixedConfig, false);
  assert.equal("success" in hourlyConfig, false);
  if ("success" in fixedConfig || "success" in hourlyConfig) return;

  const now = new Date("2026-05-11T11:00:00.000Z");
  for (const status of ["COMPLETED", "CANCELLED"] as const) {
    const zeroDuration = { status, endedAt: startedAt };
    assert.equal(elapsedWorkedMs(runningEntry({ compensationConfig: fixedConfig, ...zeroDuration }), now), 0);
    assert.equal(expectedAmountCents(runningEntry({ compensationConfig: fixedConfig, ...zeroDuration }), now), 250);
    assert.equal(expectedAmountCents(runningEntry({ compensationConfig: hourlyConfig, ...zeroDuration }), now), 0);
  }
});

test("malformed or future terminal entries cannot accrue work or hourly money", () => {
  const hourlyConfig = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "6000" });
  assert.equal("success" in hourlyConfig, false);
  if ("success" in hourlyConfig) return;

  const now = new Date("2026-05-11T11:00:00.000Z");
  for (const entry of [
    runningEntry({ compensationConfig: hourlyConfig, status: "COMPLETED", endedAt: null }),
    ...(["COMPLETED", "CANCELLED"] as const).map((status) =>
      runningEntry({ compensationConfig: hourlyConfig, status, endedAt: new Date("2026-05-11T11:00:00.001Z") }),
    ),
  ]) {
    assert.equal(elapsedWorkedMs(entry, now), 0);
    assert.equal(expectedAmountCents(entry, now), 0);
  }
});

test("fixed compensation requires a valid durable work-entry state", () => {
  const fixedConfig = parseTaskCompensationConfig({ mode: "FIXED_AMOUNT", fixedAmountCents: "250" });
  assert.equal("success" in fixedConfig, false);
  if ("success" in fixedConfig) return;

  const now = new Date("2026-05-11T11:00:00.000Z");
  const malformedEntries = [
    runningEntry({ compensationConfig: fixedConfig, status: "COMPLETED", endedAt: null }),
    runningEntry({
      compensationConfig: fixedConfig,
      status: "CANCELLED",
      endedAt: new Date("2026-05-11T11:00:00.001Z"),
    }),
    runningEntry({
      compensationConfig: fixedConfig,
      status: "PAUSED",
      pauses: [{ startedAt: new Date("2026-05-11T10:10:00.000Z"), endedAt: new Date("2026-05-11T10:20:00.000Z") }],
    }),
    runningEntry({
      compensationConfig: fixedConfig,
      status: "RUNNING",
      endedAt: new Date("2026-05-11T10:30:00.000Z"),
    }),
  ];

  for (const entry of malformedEntries) assert.equal(expectedAmountCents(entry, now), 0);

  assert.equal(expectedAmountCents(runningEntry({ compensationConfig: fixedConfig }), now), 250);
  assert.equal(
    expectedAmountCents(
      runningEntry({
        compensationConfig: fixedConfig,
        status: "PAUSED",
        pauses: [{ startedAt: new Date("2026-05-11T10:30:00.000Z"), endedAt: null }],
      }),
      now,
    ),
    250,
  );
  assert.equal(
    expectedAmountCents(
      runningEntry({ compensationConfig: fixedConfig, status: "COMPLETED", endedAt: new Date("2026-05-11T10:30:00.000Z") }),
      now,
    ),
    250,
  );
});

test("a paused entry with one valid open pause retains elapsed work before that pause", () => {
  const entry = runningEntry({
    status: "PAUSED",
    pauses: [{ startedAt: new Date("2026-05-11T10:30:00.000Z"), endedAt: null }],
  });

  assert.equal(elapsedWorkedMs(entry, new Date("2026-05-11T10:45:00.000Z")), 1_800_000);
});

test("public amount and warning APIs return safe defaults for corrupt compensation snapshots", () => {
  const corruptConfigs: unknown[] = [
    null,
    {},
    { mode: "FIXED_AMOUNT", fixedAmountCents: 0, expectedChildDurationMinutes: null, timerWarningMinutes: null },
    { mode: "FIXED_AMOUNT", fixedAmountCents: 250, hourlyRateCents: 999, expectedChildDurationMinutes: null, timerWarningMinutes: 1 },
    { mode: "HOURLY_RATE", fixedAmountCents: 250, hourlyRateCents: 999, expectedChildDurationMinutes: null, timerWarningMinutes: 1 },
    { mode: "HOURLY_RATE", hourlyRateCents: "600", expectedChildDurationMinutes: null, timerWarningMinutes: 1 },
    { mode: "NONE", fixedAmountCents: 250, expectedChildDurationMinutes: null, timerWarningMinutes: 1 },
    { mode: "NONE", expectedChildDurationMinutes: null, timerWarningMinutes: 0 },
  ];
  const now = new Date("2026-05-11T11:00:00.000Z");

  for (const compensationConfig of corruptConfigs) {
    const entry = runningEntry({ compensationConfig: compensationConfig as TaskWorkEntry["compensationConfig"] });
    assert.equal(expectedAmountCents(entry, now), 0);
    assert.equal(isTimerWarningReached(entry, now), false);
  }
});

test("public amount and warning APIs derive elapsed time from a durable compensated entry", () => {
  const config = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "800", timerWarningMinutes: "15" });
  assert.equal("success" in config, false);
  if ("success" in config) return;

  const entry = runningEntry({
    compensationConfig: config,
    pauses: [{ startedAt: new Date("2026-05-11T10:10:00.000Z"), endedAt: new Date("2026-05-11T10:20:00.000Z") }],
  });
  assert.equal(expectedAmountCents(entry, new Date("2026-05-11T10:40:00.000Z")), 400);
  assert.equal(isTimerWarningReached(entry, new Date("2026-05-11T10:24:00.000Z")), false);
  assert.equal(isTimerWarningReached(entry, new Date("2026-05-11T10:25:00.000Z")), true);

  const completed = runningEntry({
    compensationConfig: config,
    status: "COMPLETED",
    endedAt: new Date("2026-05-11T10:30:00.000Z"),
    pauses: entry.pauses,
  });
  assert.equal(expectedAmountCents(completed, new Date("2026-05-11T10:30:00.000Z")), 267);
  assert.equal(expectedAmountCents(completed, new Date("2026-05-11T12:00:00.000Z")), 267);
  assert.equal(isTimerWarningReached(completed, new Date("2026-05-11T12:00:00.000Z")), true);
});

test("hourly compensation rounds once per entry to the nearest cent, with half cents rounded up", () => {
  const config = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: "1" });
  assert.equal("success" in config, false);
  if ("success" in config) return;

  assert.equal(expectedAmountCents(runningEntry({ compensationConfig: config }), new Date("2026-05-11T10:29:59.999Z")), 0);
  assert.equal(expectedAmountCents(runningEntry({ compensationConfig: config }), new Date("2026-05-11T10:30:00.000Z")), 1);
});

test("accounting caps elapsed work and cent output without unsafe Number arithmetic", () => {
  const config = parseTaskCompensationConfig({ mode: "HOURLY_RATE", hourlyRateCents: String(Number.MAX_SAFE_INTEGER) });
  assert.equal("success" in config, false);
  if ("success" in config) return;

  const entry = runningEntry({ compensationConfig: config });
  assert.equal(elapsedWorkedMs(entry, new Date(startedAt.getTime() + MAX_ACCOUNTING_ELAPSED_MS + 1)), MAX_ACCOUNTING_ELAPSED_MS);
  assert.equal(expectedAmountCents(entry, new Date(startedAt.getTime() + MAX_ACCOUNTING_ELAPSED_MS)), MAX_ACCOUNTING_CENTS);
});

test("timer warnings are informational and do not block valid task-time actions", () => {
  assert.equal(canApplyTaskTimeAction("RUNNING", "PAUSE"), true);
  assert.equal(canApplyTaskTimeAction("RUNNING", "COMPLETE"), true);
  assert.equal(canApplyTaskTimeAction("COMPLETED", "RESUME"), false);
});
