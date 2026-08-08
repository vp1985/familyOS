import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("task time persistence schema keeps compensation snapshots and auditable account links", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  for (const enumName of [
    "TaskPayMode",
    "TaskTimeStatus",
    "TaskTimeSource",
    "TaskTimeEventType",
    "WorkAccountEntrySource",
    "WorkPayoutRequestStatus",
    "WorkPayoutMethod",
  ]) {
    assert.match(schema, new RegExp(`enum ${enumName}\\s*\\{`));
  }

  const template = schema.slice(schema.indexOf("model TaskTemplate"), schema.indexOf("model TaskAssignment"));
  const occurrence = schema.slice(schema.indexOf("model TaskOccurrence"), schema.indexOf("model TaskTimeEntry"));
  for (const model of [template, occurrence]) {
    assert.match(model, /payMode\s+TaskPayMode\s+@default\(NONE\)/);
    assert.match(model, /fixedAmountCents\s+Int\?/);
    assert.match(model, /hourlyRateCents\s+Int\?/);
    assert.match(model, /expectedChildDurationMinutes\s+Int\?/);
    assert.match(model, /timerWarningMinutes\s+Int\?/);
    assert.match(model, /unpaidTimeRequiresApproval\s+Boolean\s+@default\(false\)/);
  }

  assert.match(schema, /model TaskTimeEntry\s*\{/);
  assert.match(schema, /taskOccurrence\s+TaskOccurrence\s+@relation\(fields: \[taskOccurrenceId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(schema, /child\s+FamilyMember\s+@relation\("TaskTimeEntryChild", fields: \[childId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(schema, /model TaskTimePause\s*\{/);
  assert.match(schema, /model TaskTimeEvent\s*\{/);
  assert.match(schema, /@@index\(\[taskTimeEntryId, occurredAt\]\)/);

  assert.match(schema, /model WorkAccountEntry\s*\{/);
  assert.match(schema, /balanceAfterCents\s+Int/);
  assert.match(schema, /taskTimeEntryId\s+String\?\s+@unique/);
  assert.match(schema, /payoutRequestId\s+String\?\s+@unique/);
  assert.match(schema, /reversedEntryId\s+String\?\s+@unique/);
  assert.match(schema, /model WorkPayoutRequest\s*\{/);
  assert.match(schema, /paidAt\s+DateTime\?/);

  assert.match(schema, /model TimeMarkUserLink\s*\{/);
  assert.match(schema, /model TimeMarkImportReceipt\s*\{/);
  assert.match(schema, /externalImportReference\s+String/);
  assert.doesNotMatch(schema, /TimeMark(?:UserLink|ImportReceipt)[\s\S]{0,1200}(?:token|secret|password|credential)/i);
});
