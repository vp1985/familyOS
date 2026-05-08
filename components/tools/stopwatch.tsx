"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((milliseconds % 1000) / 100);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}

export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const storedElapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    startedAtRef.current = Date.now();
    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;
      setElapsed(storedElapsedRef.current + Date.now() - startedAtRef.current);
    }, 100);
    return () => window.clearInterval(interval);
  }, [running]);

  function start() {
    if (running) return;
    storedElapsedRef.current = elapsed;
    setRunning(true);
  }

  function pause() {
    if (!running || startedAtRef.current === null) return;
    const nextElapsed = storedElapsedRef.current + Date.now() - startedAtRef.current;
    storedElapsedRef.current = nextElapsed;
    startedAtRef.current = null;
    setElapsed(nextElapsed);
    setRunning(false);
  }

  function reset() {
    startedAtRef.current = running ? Date.now() : null;
    storedElapsedRef.current = 0;
    setElapsed(0);
    setLaps([]);
    setRunning(false);
  }

  function addLap() {
    if (elapsed <= 0) return;
    setLaps((items) => [elapsed, ...items].slice(0, 8));
  }

  return (
    <section className="space-y-4 rounded-[2rem] bg-white p-4 shadow-sm" aria-labelledby="stopwatch-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Werkzeug</p>
        <h3 id="stopwatch-title" className="text-xl font-bold text-slate-950">Stoppuhr</h3>
        <p className="mt-1 text-sm text-slate-600">Für Spiele, Übungen und kleine Familien-Challenges.</p>
      </div>

      <div className="rounded-[2rem] bg-slate-950 px-5 py-8 text-center text-white">
        <output className="font-mono text-5xl font-bold tabular-nums" aria-live="polite">{formatElapsed(elapsed)}</output>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={running ? pause : start}>{running ? "Pause" : elapsed > 0 ? "Fortsetzen" : "Start"}</Button>
        <Button type="button" onClick={reset} className="bg-slate-100 text-slate-950 hover:bg-slate-200">Reset</Button>
        <Button type="button" onClick={addLap} disabled={elapsed <= 0} className="col-span-2 bg-emerald-700 hover:bg-emerald-800">Runde merken</Button>
      </div>

      {laps.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-950">Runden</h4>
          <ol className="grid gap-2 text-sm text-slate-700">
            {laps.map((lap, index) => (
              <li key={`${lap}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2">
                <span>Runde {laps.length - index}</span>
                <span className="font-mono font-semibold tabular-nums">{formatElapsed(lap)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
