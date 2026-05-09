-- Backfill existing child cash-style accounts so kids can keep using their Bargeld/Spardosen in the household ledger.
UPDATE "FinanceAccount" AS account
SET "childCanBook" = true
FROM "FamilyMember" AS member
WHERE account."familyMemberId" = member.id
  AND member.role = 'child'
  AND account.kind IN ('CASH', 'HOME_SAVINGS');
