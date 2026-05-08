import { syncDueCalendarSources } from "../lib/calendar";
import { db } from "../lib/db";

async function main() {
  const intervalMinutes = Number(process.env.FAMILYOS_CALENDAR_SYNC_INTERVAL_MINUTES ?? "60");
  const results = await syncDueCalendarSources(Number.isFinite(intervalMinutes) ? intervalMinutes : 60);
  const ok = results.filter((result) => result.ok).length;
  const failed = results.length - ok;
  console.log(JSON.stringify({ syncedSources: results.length, ok, failed, results }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
