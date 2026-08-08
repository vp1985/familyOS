-- Protect Task 2 records that use single-column foreign keys from cross-family references.
-- These checks are intentionally scoped to the Task 2 tables; the wider schema keeps its
-- existing single-ID FK convention.
CREATE OR REPLACE FUNCTION "validateTaskTimeEntryFamilyReferences"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "TaskOccurrence"
    WHERE "id" = NEW."taskOccurrenceId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TaskTimeEntry family must match its task occurrence'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "FamilyMember"
    WHERE "id" = NEW."childId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TaskTimeEntry family must match its child'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."timeMarkImportReceiptId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "TimeMarkImportReceipt"
    WHERE "id" = NEW."timeMarkImportReceiptId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TaskTimeEntry family must match its import receipt'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TaskTimeEntry_family_reference_guard"
BEFORE INSERT OR UPDATE ON "TaskTimeEntry"
FOR EACH ROW EXECUTE FUNCTION "validateTaskTimeEntryFamilyReferences"();

CREATE OR REPLACE FUNCTION "validateTaskTimeEventFamilyReference"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "TaskTimeEntry"
    WHERE "id" = NEW."taskTimeEntryId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TaskTimeEvent family must match its task time entry'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TaskTimeEvent_family_reference_guard"
BEFORE INSERT OR UPDATE ON "TaskTimeEvent"
FOR EACH ROW EXECUTE FUNCTION "validateTaskTimeEventFamilyReference"();

CREATE OR REPLACE FUNCTION "preventTaskTimeEventMutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TaskTimeEvent records are append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "TaskTimeEvent_append_only_guard"
BEFORE UPDATE OR DELETE ON "TaskTimeEvent"
FOR EACH ROW EXECUTE FUNCTION "preventTaskTimeEventMutation"();

CREATE OR REPLACE FUNCTION "preventTaskTimeEntrySnapshotMutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."payMode" IS DISTINCT FROM OLD."payMode"
    OR NEW."fixedAmountCents" IS DISTINCT FROM OLD."fixedAmountCents"
    OR NEW."hourlyRateCents" IS DISTINCT FROM OLD."hourlyRateCents"
    OR NEW."expectedChildDurationMinutes" IS DISTINCT FROM OLD."expectedChildDurationMinutes"
    OR NEW."timerWarningMinutes" IS DISTINCT FROM OLD."timerWarningMinutes"
    OR NEW."unpaidTimeRequiresApproval" IS DISTINCT FROM OLD."unpaidTimeRequiresApproval"
  THEN
    RAISE EXCEPTION 'TaskTimeEntry compensation snapshots are immutable'
      USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TaskTimeEntry_snapshot_immutable_guard"
BEFORE UPDATE ON "TaskTimeEntry"
FOR EACH ROW EXECUTE FUNCTION "preventTaskTimeEntrySnapshotMutation"();

CREATE OR REPLACE FUNCTION "validateWorkAccountEntryFamilyReferences"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "FamilyMember"
    WHERE "id" = NEW."childId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'WorkAccountEntry family must match its child'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."taskTimeEntryId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "TaskTimeEntry"
    WHERE "id" = NEW."taskTimeEntryId"
      AND "familyId" = NEW."familyId"
      AND "childId" = NEW."childId"
  ) THEN
    RAISE EXCEPTION 'WorkAccountEntry task time entry must match family and child'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."payoutRequestId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "WorkPayoutRequest"
    WHERE "id" = NEW."payoutRequestId"
      AND "familyId" = NEW."familyId"
      AND "childId" = NEW."childId"
  ) THEN
    RAISE EXCEPTION 'WorkAccountEntry payout request must match family and child'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."reversedEntryId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "WorkAccountEntry"
    WHERE "id" = NEW."reversedEntryId"
      AND "familyId" = NEW."familyId"
      AND "childId" = NEW."childId"
  ) THEN
    RAISE EXCEPTION 'WorkAccountEntry reversed entry must match family and child'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "WorkAccountEntry_family_reference_guard"
BEFORE INSERT OR UPDATE ON "WorkAccountEntry"
FOR EACH ROW EXECUTE FUNCTION "validateWorkAccountEntryFamilyReferences"();

CREATE OR REPLACE FUNCTION "validateWorkPayoutRequestFamilyReference"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "FamilyMember"
    WHERE "id" = NEW."childId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'WorkPayoutRequest family must match its child'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "WorkPayoutRequest_family_reference_guard"
BEFORE INSERT OR UPDATE ON "WorkPayoutRequest"
FOR EACH ROW EXECUTE FUNCTION "validateWorkPayoutRequestFamilyReference"();

CREATE OR REPLACE FUNCTION "validateTimeMarkUserLinkFamilyReference"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "FamilyMember"
    WHERE "id" = NEW."familyMemberId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TimeMarkUserLink family must match its family member'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TimeMarkUserLink_family_reference_guard"
BEFORE INSERT OR UPDATE ON "TimeMarkUserLink"
FOR EACH ROW EXECUTE FUNCTION "validateTimeMarkUserLinkFamilyReference"();

CREATE OR REPLACE FUNCTION "validateTimeMarkImportReceiptFamilyReference"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "TimeMarkUserLink"
    WHERE "id" = NEW."timeMarkUserLinkId" AND "familyId" = NEW."familyId"
  ) THEN
    RAISE EXCEPTION 'TimeMarkImportReceipt family must match its user link'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TimeMarkImportReceipt_family_reference_guard"
BEFORE INSERT OR UPDATE ON "TimeMarkImportReceipt"
FOR EACH ROW EXECUTE FUNCTION "validateTimeMarkImportReceiptFamilyReference"();
