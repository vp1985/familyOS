import { ChessClock } from "@/components/tools/chess-clock";
import { Stopwatch } from "@/components/tools/stopwatch";

export default function ToolsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-sm">
        <p className="text-sm text-indigo-200">Tools</p>
        <h2 className="mt-2 text-2xl font-bold">Werkzeuge</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Kleine Helfer für Spiele, Üben und Familienalltag – ohne extra Einrichtung.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Werkzeug-Auswahl">
        <a href="#stopwatch-title" className="rounded-3xl bg-white p-4 text-sm font-semibold text-slate-950 shadow-sm">⏱️ Stoppuhr</a>
        <a href="#chess-clock-title" className="rounded-3xl bg-white p-4 text-sm font-semibold text-slate-950 shadow-sm">♟️ Schachuhr</a>
      </section>

      <Stopwatch />
      <ChessClock />
    </div>
  );
}
