"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Side = "white" | "black";
type ClockStatus = "idle" | "running" | "paused" | "flagged";

type Preset = {
  label: string;
  minutes: number;
  incrementSeconds: number;
};

const presets: Preset[] = [
  { label: "1+0", minutes: 1, incrementSeconds: 0 },
  { label: "2+1", minutes: 2, incrementSeconds: 1 },
  { label: "3+0", minutes: 3, incrementSeconds: 0 },
  { label: "3+2", minutes: 3, incrementSeconds: 2 },
  { label: "5+0", minutes: 5, incrementSeconds: 0 },
  { label: "5+3", minutes: 5, incrementSeconds: 3 },
  { label: "10+0", minutes: 10, incrementSeconds: 0 },
  { label: "10+5", minutes: 10, incrementSeconds: 5 },
  { label: "15+10", minutes: 15, incrementSeconds: 10 },
  { label: "30+0", minutes: 30, incrementSeconds: 0 },
];

function toMilliseconds(minutes: number) {
  return minutes * 60 * 1000;
}

function formatClock(milliseconds: number) {
  const safe = Math.max(0, milliseconds);
  const totalSeconds = Math.ceil(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function otherSide(side: Side): Side {
  return side === "white" ? "black" : "white";
}

export function ChessClock() {
  const [minutesInput, setMinutesInput] = useState(5);
  const [incrementInput, setIncrementInput] = useState(0);
  const [whiteTime, setWhiteTime] = useState(toMilliseconds(5));
  const [blackTime, setBlackTime] = useState(toMilliseconds(5));
  const [activeSide, setActiveSide] = useState<Side>("white");
  const [status, setStatus] = useState<ClockStatus>("idle");
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "running") return undefined;
    lastTickRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const previous = lastTickRef.current ?? now;
      const delta = now - previous;
      lastTickRef.current = now;
      if (activeSide === "white") {
        setWhiteTime((time) => {
          const next = time - delta;
          if (next <= 0) setStatus("flagged");
          return Math.max(0, next);
        });
      } else {
        setBlackTime((time) => {
          const next = time - delta;
          if (next <= 0) setStatus("flagged");
          return Math.max(0, next);
        });
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [activeSide, status]);

  function applyPreset(preset: Preset) {
    setMinutesInput(preset.minutes);
    setIncrementInput(preset.incrementSeconds);
    setWhiteTime(toMilliseconds(preset.minutes));
    setBlackTime(toMilliseconds(preset.minutes));
    setActiveSide("white");
    setStatus("idle");
    lastTickRef.current = null;
  }

  function applyCustom() {
    const safeMinutes = Math.max(1, Math.min(180, minutesInput));
    const safeIncrement = Math.max(0, Math.min(60, incrementInput));
    setMinutesInput(safeMinutes);
    setIncrementInput(safeIncrement);
    setWhiteTime(toMilliseconds(safeMinutes));
    setBlackTime(toMilliseconds(safeMinutes));
    setActiveSide("white");
    setStatus("idle");
    lastTickRef.current = null;
  }

  function startPause() {
    if (status === "flagged") return;
    setStatus((current) => (current === "running" ? "paused" : "running"));
    lastTickRef.current = null;
  }

  function reset() {
    setWhiteTime(toMilliseconds(minutesInput));
    setBlackTime(toMilliseconds(minutesInput));
    setActiveSide("white");
    setStatus("idle");
    lastTickRef.current = null;
  }

  function switchTurn(side: Side) {
    if (status === "flagged") return;
    if (status === "idle") {
      setActiveSide(otherSide(side));
      setStatus("running");
      lastTickRef.current = null;
      return;
    }
    if (status !== "running" || side !== activeSide) return;
    const increment = incrementInput * 1000;
    if (side === "white") setWhiteTime((time) => time + increment);
    if (side === "black") setBlackTime((time) => time + increment);
    setActiveSide(otherSide(side));
    lastTickRef.current = null;
  }

  const flaggedLabel = whiteTime <= 0 ? "Weiß Zeit abgelaufen" : blackTime <= 0 ? "Schwarz Zeit abgelaufen" : "Zeit abgelaufen";

  return (
    <section className="space-y-4 rounded-[2rem] bg-white p-4 shadow-sm" aria-labelledby="chess-clock-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Werkzeug</p>
        <h3 id="chess-clock-title" className="text-xl font-bold text-slate-950">Schachuhr</h3>
        <p className="mt-1 text-sm text-slate-600">Gängige Zeiten mit Inkrement, gut für schnelle Partien.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => switchTurn("white")}
          className={`rounded-[2rem] border p-4 text-left shadow-sm ${activeSide === "white" && status === "running" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
          aria-label="Weiß Uhr drücken"
        >
          <span className="text-sm font-semibold text-slate-600">Weiß</span>
          <span className="mt-3 block font-mono text-4xl font-bold tabular-nums text-slate-950">{formatClock(whiteTime)}</span>
        </button>
        <button
          type="button"
          onClick={() => switchTurn("black")}
          className={`rounded-[2rem] border p-4 text-left shadow-sm ${activeSide === "black" && status === "running" ? "border-emerald-500 bg-emerald-50" : "border-slate-900 bg-slate-950 text-white"}`}
          aria-label="Schwarz Uhr drücken"
        >
          <span className={activeSide === "black" && status === "running" ? "text-sm font-semibold text-slate-600" : "text-sm font-semibold text-slate-300"}>Schwarz</span>
          <span className={`mt-3 block font-mono text-4xl font-bold tabular-nums ${activeSide === "black" && status === "running" ? "text-slate-950" : "text-white"}`}>{formatClock(blackTime)}</span>
        </button>
      </div>

      {status === "flagged" ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{flaggedLabel}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={startPause}>{status === "running" ? "Pause" : status === "paused" ? "Fortsetzen" : "Start"}</Button>
        <Button type="button" onClick={reset} className="bg-slate-100 text-slate-950 hover:bg-slate-200">Reset</Button>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-950">Presets</h4>
        <div className="grid grid-cols-5 gap-2">
          {presets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="rounded-2xl bg-slate-100 px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-50 p-3">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Minuten
          <input type="number" min="1" max="180" value={minutesInput} onChange={(event) => setMinutesInput(Number(event.target.value))} className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Inkrement
          <input type="number" min="0" max="60" value={incrementInput} onChange={(event) => setIncrementInput(Number(event.target.value))} className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" />
        </label>
        <Button type="button" onClick={applyCustom} className="self-end px-3">Setzen</Button>
      </div>
    </section>
  );
}
