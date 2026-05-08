import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getKidsTaskData } from "@/lib/dashboard";
import { markKidsTaskDoneAction } from "./actions";

export default async function KidsPage() {
  const { view } = await getKidsTaskData();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-sky-500 via-emerald-500 to-lime-400 p-5 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Kinder-Modus</p>
        <h2 className="mt-2 text-3xl font-black">Meine Aufgaben heute</h2>
        <p className="mt-3 text-sm leading-6 text-white/90">
          Such deinen Namen aus, mach deine Karte fertig und tippe danach auf „Ich hab’s gemacht“.
        </p>
      </section>

      {view.children.length === 0 ? (
        <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">👋</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Noch keine Kinderprofile</h3>
          <p className="mt-2 text-sm text-slate-600">Ein Elternteil kann zuerst ein Profil anlegen.</p>
          <Button asChild className="mt-4 min-h-11 px-4">
            <Link href="/app/family">Profile öffnen</Link>
          </Button>
        </section>
      ) : null}

      <div className="space-y-4">
        {view.children.map((child) => (
          <section key={child.id} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                {child.icon ?? "⭐"}
              </span>
              <div>
                <h3 className="text-xl font-black text-slate-950">{child.name}</h3>
                <p className="text-sm text-slate-500">{child.tasks.length === 0 ? "Alles frei" : `${child.tasks.length} Aufgabe(n)`}</p>
              </div>
            </div>

            {child.tasks.length === 0 ? (
              <p className="rounded-2xl bg-lime-50 px-4 py-4 text-sm font-semibold text-lime-800">Heute nichts offen. Stark! 🎉</p>
            ) : (
              <div className="grid gap-3">
                {child.tasks.map((task) => (
                  <article key={task.id} className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
                    <h4 className="text-lg font-black text-slate-950">{task.title}</h4>
                    {task.rewardLabels.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.rewardLabels.map((label) => (
                          <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                            + {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <form action={markKidsTaskDoneAction} className="mt-4">
                      <input type="hidden" name="occurrenceId" value={task.id} />
                      <Button type="submit" className="min-h-12 w-full rounded-2xl text-base font-black">Ich hab’s gemacht</Button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
