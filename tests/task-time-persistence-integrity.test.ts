import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

function databaseUrlFromLocalEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!existsSync(".env")) return undefined;
  return readFileSync(".env", "utf8").match(/^DATABASE_URL=["']?([^\r\n"']+)["']?$/m)?.[1];
}

type RawExecutor = Pick<PrismaClient, "$executeRawUnsafe">;

async function expectDatabaseRejection(tx: RawExecutor, statement: string) {
  await tx.$executeRawUnsafe("SAVEPOINT task_time_expected_failure");
  try {
    await assert.rejects(tx.$executeRawUnsafe(statement));
  } finally {
    await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT task_time_expected_failure");
    await tx.$executeRawUnsafe("RELEASE SAVEPOINT task_time_expected_failure");
  }
}

test("Task 2 persistence triggers reject cross-family references and ledger mutation", async (t) => {
  const databaseUrl = databaseUrlFromLocalEnv();
  if (!databaseUrl) {
    t.skip("DATABASE_URL or a project-local .env is required for the PostgreSQL integration fixture");
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const prefix = `task-time-integrity-${randomUUID()}`;
  const id = (name: string) => `${prefix}-${name}`;
  const rollback = new Error("rollback disposable task-time fixture");

  try {
    const triggerRows = await prisma.$queryRawUnsafe<Array<{ tgname: string }>>(
      `SELECT tgname FROM pg_trigger WHERE tgrelid IN ('"TaskTimeEntry"'::regclass, '"TaskTimeEvent"'::regclass, '"WorkAccountEntry"'::regclass, '"WorkPayoutRequest"'::regclass, '"TimeMarkUserLink"'::regclass, '"TimeMarkImportReceipt"'::regclass) AND NOT tgisinternal`,
    );
    const triggerNames = new Set(triggerRows.map((row) => row.tgname));
    for (const triggerName of [
      "TaskTimeEntry_family_reference_guard",
      "TaskTimeEntry_snapshot_immutable_guard",
      "TaskTimeEvent_family_reference_guard",
      "TaskTimeEvent_append_only_guard",
      "WorkAccountEntry_family_reference_guard",
      "WorkPayoutRequest_family_reference_guard",
      "TimeMarkUserLink_family_reference_guard",
      "TimeMarkImportReceipt_family_reference_guard",
    ]) {
      assert.ok(triggerNames.has(triggerName), `expected ${triggerName} to be installed`);
    }

    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`INSERT INTO "Family" ("id", "name", "updatedAt") VALUES ('${id("family-a")}', 'Fixture A', CURRENT_TIMESTAMP), ('${id("family-b")}', 'Fixture B', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "User" ("id", "email", "name", "passwordHash", "updatedAt") VALUES ('${id("user")}', '${id("user")}@example.test', 'Fixture User', 'hash', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "FamilyMember" ("id", "familyId", "name", "role", "updatedAt") VALUES ('${id("child-a")}', '${id("family-a")}', 'Child A', 'child', CURRENT_TIMESTAMP), ('${id("child-b")}', '${id("family-b")}', 'Child B', 'child', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "TaskTemplate" ("id", "familyId", "title", "category", "createdByUserId", "updatedAt") VALUES ('${id("template-a")}', '${id("family-a")}', 'Task A', 'fixture', '${id("user")}', CURRENT_TIMESTAMP), ('${id("template-b")}', '${id("family-b")}', 'Task B', 'fixture', '${id("user")}', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "TaskOccurrence" ("id", "familyId", "taskTemplateId", "familyMemberId", "titleSnapshot", "updatedAt") VALUES ('${id("occurrence-a")}', '${id("family-a")}', '${id("template-a")}', '${id("child-a")}', 'Task A', CURRENT_TIMESTAMP), ('${id("occurrence-b")}', '${id("family-b")}', '${id("template-b")}', '${id("child-b")}', 'Task B', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "TimeMarkUserLink" ("id", "familyId", "familyMemberId", "externalUserReference", "updatedAt") VALUES ('${id("link-a")}', '${id("family-a")}', '${id("child-a")}', 'external-a', CURRENT_TIMESTAMP), ('${id("link-b")}', '${id("family-b")}', '${id("child-b")}', 'external-b', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "TimeMarkImportReceipt" ("id", "familyId", "timeMarkUserLinkId", "externalImportReference") VALUES ('${id("receipt-a")}', '${id("family-a")}', '${id("link-a")}', 'import-a'), ('${id("receipt-b")}', '${id("family-b")}', '${id("link-b")}', 'import-b')`);
        await tx.$executeRawUnsafe(`INSERT INTO "TaskTimeEntry" ("id", "familyId", "taskOccurrenceId", "childId", "startedAt", "payMode", "fixedAmountCents", "updatedAt") VALUES ('${id("entry-a")}', '${id("family-a")}', '${id("occurrence-a")}', '${id("child-a")}', CURRENT_TIMESTAMP, 'FIXED_AMOUNT', 125, CURRENT_TIMESTAMP), ('${id("entry-b")}', '${id("family-b")}', '${id("occurrence-b")}', '${id("child-b")}', CURRENT_TIMESTAMP, 'NONE', NULL, CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "WorkPayoutRequest" ("id", "familyId", "childId", "amountCents", "method", "updatedAt") VALUES ('${id("payout-a")}', '${id("family-a")}', '${id("child-a")}', 50, 'CASH', CURRENT_TIMESTAMP), ('${id("payout-b")}', '${id("family-b")}', '${id("child-b")}', 50, 'CASH', CURRENT_TIMESTAMP)`);
        await tx.$executeRawUnsafe(`INSERT INTO "WorkAccountEntry" ("id", "familyId", "childId", "amountCents", "balanceAfterCents", "source") VALUES ('${id("account-a")}', '${id("family-a")}', '${id("child-a")}', 125, 125, 'TASK_TIME'), ('${id("account-b")}', '${id("family-b")}', '${id("child-b")}', 50, 50, 'PAYOUT')`);
        await tx.$executeRawUnsafe(`INSERT INTO "TaskTimeEvent" ("id", "familyId", "taskTimeEntryId", "type") VALUES ('${id("event-a")}', '${id("family-a")}', '${id("entry-a")}', 'STARTED')`);

        await expectDatabaseRejection(tx, `INSERT INTO "TaskTimeEntry" ("id", "familyId", "taskOccurrenceId", "childId", "startedAt", "updatedAt") VALUES ('${id("bad-entry-occurrence")}', '${id("family-a")}', '${id("occurrence-b")}', '${id("child-a")}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
        await expectDatabaseRejection(tx, `INSERT INTO "TaskTimeEntry" ("id", "familyId", "taskOccurrenceId", "childId", "startedAt", "updatedAt") VALUES ('${id("bad-entry-child")}', '${id("family-a")}', '${id("occurrence-a")}', '${id("child-b")}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
        await expectDatabaseRejection(tx, `INSERT INTO "TaskTimeEntry" ("id", "familyId", "taskOccurrenceId", "childId", "timeMarkImportReceiptId", "startedAt", "updatedAt") VALUES ('${id("bad-entry-receipt")}', '${id("family-a")}', '${id("occurrence-a")}', '${id("child-a")}', '${id("receipt-b")}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
        await expectDatabaseRejection(tx, `INSERT INTO "TaskTimeEvent" ("id", "familyId", "taskTimeEntryId", "type") VALUES ('${id("bad-event")}', '${id("family-a")}', '${id("entry-b")}', 'STARTED')`);
        await expectDatabaseRejection(tx, `UPDATE "TaskTimeEvent" SET "reason" = 'changed' WHERE "id" = '${id("event-a")}'`);
        await expectDatabaseRejection(tx, `DELETE FROM "TaskTimeEvent" WHERE "id" = '${id("event-a")}'`);
        await expectDatabaseRejection(tx, `UPDATE "TaskTimeEntry" SET "fixedAmountCents" = 200 WHERE "id" = '${id("entry-a")}'`);
        await expectDatabaseRejection(tx, `INSERT INTO "WorkPayoutRequest" ("id", "familyId", "childId", "amountCents", "method", "updatedAt") VALUES ('${id("bad-payout")}', '${id("family-a")}', '${id("child-b")}', 50, 'CASH', CURRENT_TIMESTAMP)`);
        await expectDatabaseRejection(tx, `INSERT INTO "WorkAccountEntry" ("id", "familyId", "childId", "amountCents", "balanceAfterCents", "source", "taskTimeEntryId") VALUES ('${id("bad-account-entry")}', '${id("family-a")}', '${id("child-a")}', 1, 1, 'TASK_TIME', '${id("entry-b")}')`);
        await expectDatabaseRejection(tx, `INSERT INTO "WorkAccountEntry" ("id", "familyId", "childId", "amountCents", "balanceAfterCents", "source", "payoutRequestId") VALUES ('${id("bad-account-payout")}', '${id("family-a")}', '${id("child-a")}', 1, 1, 'PAYOUT', '${id("payout-b")}')`);
        await expectDatabaseRejection(tx, `INSERT INTO "WorkAccountEntry" ("id", "familyId", "childId", "amountCents", "balanceAfterCents", "source", "reversedEntryId") VALUES ('${id("bad-account-reversal")}', '${id("family-a")}', '${id("child-a")}', -1, 0, 'REVERSAL', '${id("account-b")}')`);
        await expectDatabaseRejection(tx, `INSERT INTO "TimeMarkUserLink" ("id", "familyId", "familyMemberId", "externalUserReference", "updatedAt") VALUES ('${id("bad-link")}', '${id("family-a")}', '${id("child-b")}', 'external-bad', CURRENT_TIMESTAMP)`);
        await expectDatabaseRejection(tx, `INSERT INTO "TimeMarkImportReceipt" ("id", "familyId", "timeMarkUserLinkId", "externalImportReference") VALUES ('${id("bad-receipt")}', '${id("family-a")}', '${id("link-b")}', 'import-bad')`);

        throw rollback;
      }),
      rollback,
    );
  } finally {
    await prisma.$disconnect();
  }
});
