export const TASK_COMPENSATION_MODES = ["NONE", "FIXED_AMOUNT", "HOURLY_RATE"] as const;
export type TaskCompensationMode = (typeof TASK_COMPENSATION_MODES)[number];
/** Backward-compatible public name for the compensation mode. */
export type TaskPayMode = TaskCompensationMode;

/**
 * Timer/accounting values are capped to ten years per entry. This bounds stored
 * duration settings and prevents invalid durable timestamps from creating an
 * unbounded accounting calculation.
 */
export const MAX_ACCOUNTING_ELAPSED_MS = 10 * 365 * 24 * 60 * 60 * 1_000;
export const MAX_ACCOUNTING_CENTS = Number.MAX_SAFE_INTEGER;
const HOUR_MS = 60 * 60 * 1_000;
const MAX_ACCOUNTING_MINUTES = MAX_ACCOUNTING_ELAPSED_MS / 60_000;

export type TaskCompensationConfig = Readonly<
  | {
      mode: "NONE";
      expectedChildDurationMinutes: number | null;
      timerWarningMinutes: number | null;
    }
  | {
      mode: "FIXED_AMOUNT";
      fixedAmountCents: number;
      expectedChildDurationMinutes: number | null;
      timerWarningMinutes: number | null;
    }
  | {
      mode: "HOURLY_RATE";
      hourlyRateCents: number;
      expectedChildDurationMinutes: number | null;
      timerWarningMinutes: number | null;
    }>;

export type TaskWorkEntryStatus = "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type TaskWorkEntrySource = "TIMER" | "MANUAL";
/** Backward-compatible public names for durable time-entry values. */
export type TaskTimeStatus = TaskWorkEntryStatus;
export type TaskTimeSource = TaskWorkEntrySource;

export type TaskWorkPause = {
  startedAt: Date;
  endedAt: Date | null;
};

/**
 * Durable timer state. `compensationConfig` is a snapshot taken for this entry,
 * so later task setting edits cannot change completed or in-progress accounting.
 */
export type TaskWorkEntry = {
  id: string;
  taskOccurrenceId: string;
  status: TaskWorkEntryStatus;
  source: TaskWorkEntrySource;
  startedAt: Date;
  endedAt: Date | null;
  pauses: readonly TaskWorkPause[];
  readonly compensationConfig: Readonly<TaskCompensationConfig>;
};

export type TaskTimeAction = "START" | "PAUSE" | "RESUME" | "COMPLETE" | "CANCEL";
export type TaskTimeActionStatus = TaskWorkEntryStatus | "NOT_STARTED";

type CompensationInput = Record<string, unknown>;

function isCompensationInput(value: unknown): value is CompensationInput {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(input: CompensationInput, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;

  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNullablePositiveInteger(value: unknown): number | null | undefined {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) return null;
  return parsePositiveInteger(value) ?? undefined;
}

function hasPopulatedAmount(input: CompensationInput, key: "fixedAmountCents" | "hourlyRateCents") {
  if (!hasOwn(input, key)) return false;
  const value = input[key];
  return value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "");
}

/** Parses only server-owned compensation settings; client elapsed time and money are never inputs. */
export function parseTaskCompensationConfig(input: unknown): TaskCompensationConfig | { success: false } {
  try {
    if (!isCompensationInput(input) || !hasOwn(input, "mode")) return { success: false };

    const expectedChildDurationMinutes = parseNullablePositiveInteger(input.expectedChildDurationMinutes);
    const timerWarningMinutes = parseNullablePositiveInteger(input.timerWarningMinutes);
    if (
      expectedChildDurationMinutes === undefined ||
      timerWarningMinutes === undefined ||
      (expectedChildDurationMinutes !== null && expectedChildDurationMinutes > MAX_ACCOUNTING_MINUTES) ||
      (timerWarningMinutes !== null && timerWarningMinutes > MAX_ACCOUNTING_MINUTES)
    ) {
      return { success: false };
    }

    const mode = input.mode;
    if (!TASK_COMPENSATION_MODES.includes(mode as TaskCompensationMode)) return { success: false };

    const includesFixedAmount = hasPopulatedAmount(input, "fixedAmountCents");
    const includesHourlyRate = hasPopulatedAmount(input, "hourlyRateCents");
    if ((mode === "NONE" && (includesFixedAmount || includesHourlyRate)) || (includesFixedAmount && includesHourlyRate)) {
      return { success: false };
    }

    const common = { expectedChildDurationMinutes, timerWarningMinutes };
    if (mode === "NONE") return { mode, ...common };

    if (mode === "FIXED_AMOUNT" && includesFixedAmount) {
      const fixedAmountCents = parsePositiveInteger(input.fixedAmountCents);
      return fixedAmountCents === null ? { success: false } : { mode, fixedAmountCents, ...common };
    }

    if (mode === "HOURLY_RATE" && includesHourlyRate) {
      const hourlyRateCents = parsePositiveInteger(input.hourlyRateCents);
      return hourlyRateCents === null ? { success: false } : { mode, hourlyRateCents, ...common };
    }

    return { success: false };
  } catch {
    return { success: false };
  }
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNullableAccountingMinutes(value: unknown): value is number | null {
  return value === null || (isPositiveSafeInteger(value) && value <= MAX_ACCOUNTING_MINUTES);
}

/** Narrows deserialized compensation snapshots before public accounting reads. */
function validCompensationSnapshot(value: unknown): TaskCompensationConfig | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as CompensationInput;
  if (
    !hasOwn(input, "expectedChildDurationMinutes") ||
    !hasOwn(input, "timerWarningMinutes") ||
    !isNullableAccountingMinutes(input.expectedChildDurationMinutes) ||
    !isNullableAccountingMinutes(input.timerWarningMinutes)
  ) {
    return null;
  }

  const common = {
    expectedChildDurationMinutes: input.expectedChildDurationMinutes,
    timerWarningMinutes: input.timerWarningMinutes,
  };
  const hasFixedAmount = hasPopulatedAmount(input, "fixedAmountCents");
  const hasHourlyRate = hasPopulatedAmount(input, "hourlyRateCents");

  // Persisted snapshots are untrusted: unlike form input, an amount that is
  // populated for an inactive mode makes the entire snapshot corrupt.
  if (input.mode === "NONE" && !hasFixedAmount && !hasHourlyRate) return { mode: "NONE", ...common };

  if (input.mode === "FIXED_AMOUNT" && isPositiveSafeInteger(input.fixedAmountCents) && !hasHourlyRate) {
    return { mode: "FIXED_AMOUNT", fixedAmountCents: input.fixedAmountCents, ...common };
  }

  if (input.mode === "HOURLY_RATE" && isPositiveSafeInteger(input.hourlyRateCents) && !hasFixedAmount) {
    return { mode: "HOURLY_RATE", hourlyRateCents: input.hourlyRateCents, ...common };
  }

  return null;
}

function validTimestamp(value: unknown): number | null {
  if (!(value instanceof Date)) return null;
  const milliseconds = value.getTime();
  return Number.isSafeInteger(milliseconds) ? milliseconds : null;
}

function hasValidActivePause(entry: TaskWorkEntry, startedAtMs: number, nowMs: number): boolean {
  if (!Array.isArray(entry.pauses)) return false;

  const activePauses = entry.pauses.filter((pause) => pause?.endedAt === null);
  if (activePauses.length !== 1) return false;

  const activePauseStartedAtMs = validTimestamp(activePauses[0]?.startedAt);
  return activePauseStartedAtMs !== null && activePauseStartedAtMs >= startedAtMs && activePauseStartedAtMs <= nowMs;
}

function hasNoOpenPauses(entry: TaskWorkEntry): boolean {
  return Array.isArray(entry.pauses) && entry.pauses.every((pause) => pause?.endedAt !== null);
}

/** Validates durable state before any elapsed-time or compensation calculation. */
function hasValidWorkEntryState(entry: TaskWorkEntry, startedAtMs: number, nowMs: number): boolean {
  if (!Array.isArray(entry.pauses)) return false;

  switch (entry.status) {
    case "COMPLETED":
    case "CANCELLED": {
      const endedAtMs = validTimestamp(entry.endedAt);
      return hasNoOpenPauses(entry) && endedAtMs !== null && endedAtMs >= startedAtMs && endedAtMs <= nowMs;
    }
    case "RUNNING":
      return hasNoOpenPauses(entry) && entry.endedAt === null && startedAtMs <= nowMs;
    case "PAUSED":
      return entry.endedAt === null && hasValidActivePause(entry, startedAtMs, nowMs);
    default:
      return false;
  }
}

function hasValidWorkEntry(entry: TaskWorkEntry, now: Date): boolean {
  const startedAtMs = validTimestamp(entry.startedAt);
  const nowMs = validTimestamp(now);
  return startedAtMs !== null && nowMs !== null && hasValidWorkEntryState(entry, startedAtMs, nowMs);
}

/**
 * Returns milliseconds actively worked through server-owned `now`. Invalid entry
 * state/timestamp boundaries return zero; invalid, reversed, or out-of-work
 * historical pauses are ignored. Work is capped at `MAX_ACCOUNTING_ELAPSED_MS`
 * for safe accounting.
 */
export function elapsedWorkedMs(entry: TaskWorkEntry, now: Date): number {
  const startedAtMs = validTimestamp(entry.startedAt);
  const nowMs = validTimestamp(now);
  if (startedAtMs === null || nowMs === null) return 0;

  if (!hasValidWorkEntryState(entry, startedAtMs, nowMs)) return 0;

  const isTerminal = entry.status === "COMPLETED" || entry.status === "CANCELLED";
  const terminalAtMs = isTerminal ? validTimestamp(entry.endedAt) : nowMs;
  if (terminalAtMs === null) return 0;

  // Clamp before subtraction: Date values can be individually safe while their
  // difference is not. This guarantees every subsequent Number duration is safe.
  const endMs = terminalAtMs > startedAtMs + MAX_ACCOUNTING_ELAPSED_MS ? startedAtMs + MAX_ACCOUNTING_ELAPSED_MS : terminalAtMs;
  const pauseRanges = (Array.isArray(entry.pauses) ? entry.pauses : [])
    .map((pause) => {
      const pauseStart = validTimestamp(pause?.startedAt);
      const pauseEnd = pause?.endedAt === null ? endMs : validTimestamp(pause?.endedAt);
      return pauseStart === null || pauseEnd === null
        ? null
        : { start: Math.max(startedAtMs, pauseStart), end: Math.min(endMs, pauseEnd) };
    })
    .filter((range): range is { start: number; end: number } => range !== null && range.end > range.start)
    .sort((left, right) => left.start - right.start);

  let pausedMs = 0;
  let coveredUntil = startedAtMs;
  for (const range of pauseRanges) {
    const uncoveredStart = Math.max(coveredUntil, range.start);
    if (range.end > uncoveredStart) pausedMs += range.end - uncoveredStart;
    coveredUntil = Math.max(coveredUntil, range.end);
  }

  return Math.max(0, endMs - startedAtMs - pausedMs);
}

function hourlyAmountCents(hourlyRateCents: number, elapsedMs: number): number {
  if (!Number.isSafeInteger(hourlyRateCents) || hourlyRateCents <= 0 || !Number.isSafeInteger(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }

  // BigInt avoids an unsafe rate × duration Number product. Round exactly once
  // for each entry, to the nearest cent, with a half cent rounded up.
  const numerator = BigInt(hourlyRateCents) * BigInt(elapsedMs);
  const divisor = BigInt(HOUR_MS);
  let rounded = numerator / divisor;
  if ((numerator % divisor) * BigInt(2) >= divisor) rounded += BigInt(1);
  const capped = rounded > BigInt(MAX_ACCOUNTING_CENTS) ? BigInt(MAX_ACCOUNTING_CENTS) : rounded;
  return Number(capped);
}

/**
 * Calculates an entry's compensation from its snapshotted configuration and
 * server-derived timestamps. No public amount API accepts caller-supplied elapsed time.
 */
export function expectedAmountCents(entry: TaskWorkEntry, now: Date): number {
  if (!hasValidWorkEntry(entry, now)) return 0;

  const config = validCompensationSnapshot(entry.compensationConfig);
  if (config === null || config.mode === "NONE") return 0;
  if (config.mode === "FIXED_AMOUNT") return config.fixedAmountCents;
  return hourlyAmountCents(config.hourlyRateCents, elapsedWorkedMs(entry, now));
}

/** Warnings are informational; callers must not treat them as a terminal timer state. */
export function isTimerWarningReached(entry: TaskWorkEntry, now: Date): boolean {
  const config = validCompensationSnapshot(entry.compensationConfig);
  if (config === null || config.timerWarningMinutes === null) return false;

  return elapsedWorkedMs(entry, now) >= config.timerWarningMinutes * 60_000;
}

export function canApplyTaskTimeAction(status: TaskTimeActionStatus, action: TaskTimeAction): boolean {
  switch (status) {
    case "NOT_STARTED":
      return action === "START";
    case "RUNNING":
      return action === "PAUSE" || action === "COMPLETE" || action === "CANCEL";
    case "PAUSED":
      return action === "RESUME" || action === "COMPLETE" || action === "CANCEL";
    case "COMPLETED":
    case "CANCELLED":
      return false;
  }
}
