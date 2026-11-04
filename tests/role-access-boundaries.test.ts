import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("parent-only data services require a family admin", () => {
  const sources = [
    "lib/dashboard.ts",
    "lib/finances.ts",
    "lib/child-money.ts",
    "lib/calendar.ts",
    "lib/family-members.ts",
    "lib/household-budget.ts",
    "lib/relationships.ts",
    "lib/projects.ts",
    "lib/planning.ts",
    "lib/renovation.ts",
    "lib/rules.ts",
    "lib/tasks.ts",
  ].map(read);

  for (const source of sources) {
    assert.match(source, /requireFamilyAdmin/);
  }
});

test("child-facing reads and writes derive their profile from the authenticated membership", () => {
  const context = read("lib/family-context.ts");
  const dashboard = read("lib/dashboard.ts");
  const money = read("lib/child-money.ts");
  const media = read("lib/media-time.ts");
  const checklists = read("lib/checklists.ts");
  const ledger = read("lib/child-ledger.ts");
  const finances = read("lib/finances.ts");
  const tasks = read("lib/tasks.ts");
  const policy = read("lib/family-access-policy.ts");
  const kidsActions = read("app/app/kids/actions.ts");

  assert.match(context, /familyMemberId: familyUser\.familyMemberId/);
  assert.match(context, /requireChildContext/);
  assert.match(context, /resolveFamilyAdminOrChildScope/);
  assert.match(policy, /resolveFamilyAdminOrChildScope/);
  for (const source of [dashboard, money, media, checklists]) {
    assert.match(source, /requireFamilyAdminOrChild/);
    assert.match(source, /const childId = context\.childMemberId/);
  }
  assert.match(ledger, /canAccessChildMember/);
  assert.match(finances, /canAccessChildMember/);
  assert.match(checklists, /canAccessChecklist/);
  assert.match(tasks, /familyMemberId: context\.childMemberId/);
  assert.match(kidsActions, /markOwnTaskOccurrenceDone/);
});
