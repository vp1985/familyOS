"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChessPlayerOption } from "@/lib/chess-competition";
import { CHESS_RESULT_OPTIONS } from "@/lib/chess-competition";
import { createCompetitionPlayerAction } from "@/app/app/tools/actions";

type Side = "white" | "black";
type ClockStatus = "idle" | "running" | "paused" | "flagged" | "ended";
type EndStep = "none" | "confirm" | "result";

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

function formatTotal(milliseconds: number) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function otherSide(side: Side): Side {
  return side === "white" ? "black" : "white";
}

function playerName(players: ChessPlayerOption[], selectedId: string, fallback: string) {
  return players.find((player) => player.id === selectedId)?.name ?? fallback;
}

export function ChessClock({ players }: { players: ChessPlayerOption[] }) {
  const [minutesInput, setMinutesInput] = useState(5);
  const [incrementInput, setIncrementInput] = useState(0);
  const [whiteTime, setWhiteTime] = useState(toMilliseconds(5));
  const [blackTime, setBlackTime] = useState(toMilliseconds(5));
  const [activeSide, setActiveSide] = useState<Side>("white");
  const [status, setStatus] = useState<ClockStatus>("idle");
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [blackMoves, setBlackMoves] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [whitePlayerId, setWhitePlayerId] = useState(players[0]?.id ?? "");
  const [blackPlayerId, setBlackPlayerId] = useState(players[1]?.id ?? players[0]?.id ?? "");
  const [endStep, setEndStep] = useState<EndStep>("none");
  const [statusBeforeEnd, setStatusBeforeEnd] = useState<ClockStatus>("idle");
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "running") return undefined;
    lastTickRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const previous = lastTickRef.current ?? now;
      const delta = now - previous;
      lastTickRef.current = now;
      setElapsedMs((time) => time + delta);
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

  const whiteName = useMemo(() => playerName(players, whitePlayerId, "Weiß"), [players, whitePlayerId]);
  const blackName = useMemo(() => playerName(players, blackPlayerId, "Schwarz"), [players, blackPlayerId]);
  const gameActive = status !== "idle";

  function resetCounters() {
    setWhiteMoves(0);
    setBlackMoves(0);
    setElapsedMs(0);
    setResultLabel(null);
  }

  function applyPreset(preset: Preset) {
    setMinutesInput(preset.minutes);
    setIncrementInput(preset.incrementSeconds);
    setWhiteTime(toMilliseconds(preset.minutes));
    setBlackTime(toMilliseconds(preset.minutes));
    setActiveSide("white");
    setStatus("idle");
    setEndStep("none");
    resetCounters();
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
    setEndStep("none");
    resetCounters();
    lastTickRef.current = null;
  }

  function pauseResume() {
    if (status === "flagged" || status === "ended") return;
    setStatus((current) => (current === "running" ? "paused" : "running"));
    lastTickRef.current = null;
  }

  function reset() {
    setWhiteTime(toMilliseconds(minutesInput));
    setBlackTime(toMilliseconds(minutesInput));
    setActiveSide("white");
    setStatus("idle");
    setEndStep("none");
    resetCounters();
    lastTickRef.current = null;
  }

  function switchTurn(side: Side) {
    if (status === "flagged" || status === "ended" || endStep !== "none") return;
    if (status === "idle") {
      if (side === "white") setWhiteMoves((count) => count + 1);
      if (side === "black") setBlackMoves((count) => count + 1);
      setActiveSide(otherSide(side));
      setStatus("running");
      lastTickRef.current = null;
      return;
    }
    if (status !== "running" || side !== activeSide) return;
    const increment = incrementInput * 1000;
    if (side === "white") {
      setWhiteTime((time) => time + increment);
      setWhiteMoves((count) => count + 1);
    }
    if (side === "black") {
      setBlackTime((time) => time + increment);
      setBlackMoves((count) => count + 1);
    }
    setActiveSide(otherSide(side));
    lastTickRef.current = null;
  }

  function requestEnd() {
    if (status === "idle") return;
    setStatusBeforeEnd(status);
    setStatus("paused");
    setEndStep("confirm");
    lastTickRef.current = null;
  }

  function continueAfterCancel() {
    setEndStep("none");
    setStatus(statusBeforeEnd === "running" ? "running" : statusBeforeEnd);
    lastTickRef.current = null;
  }

  function chooseResult(label: string) {
    setResultLabel(label);
    setEndStep("none");
    setStatus("ended");
  }

  const flaggedLabel = whiteTime <= 0 ? "Weiß Zeit abgelaufen" : blackTime <= 0 ? "Schwarz Zeit abgelaufen" : "Zeit abgelaufen";

  return (
    <section className="space-y-4 rounded-[2rem] bg-white p-4 shadow-sm" aria-labelledby="chess-clock-title">
      {!gameActive ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Werkzeug</p>
            <h3 id="chess-clock-title" className="text-xl font-bold text-slate-950">Schachuhr</h3>
            <p className="mt-1 text-sm text-slate-600">Spieler auswählen, Gastnamen speichern und dann ablenkungsfrei spielen.</p>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Weiß unten
                <select value={whitePlayerId} onChange={(event) => setWhitePlayerId(event.target.value)} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950">
                  <option value="">Weiß</option>
                  {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Schwarz oben
                <select value={blackPlayerId} onChange={(event) => setBlackPlayerId(event.target.value)} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950">
                  <option value="">Schwarz</option>
                  {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
              </label>
            </div>
            <form action={createCompetitionPlayerAction} className="grid grid-cols-[1fr_auto] gap-2">
              <input name="name" minLength={2} maxLength={80} placeholder="Gastnamen hinzufügen" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" />
              <button type="submit" className="rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">Speichern</button>
            </form>
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
            <button type="button" onClick={applyCustom} className="self-end rounded-2xl bg-slate-950 px-3 py-3 text-sm font-bold text-white">Setzen</button>
          </div>
        </div>
      ) : null}

      <div className={gameActive ? "-mx-4 -mb-4 grid min-h-[calc(100dvh-7rem)] grid-rows-[1fr_auto_1fr] overflow-hidden rounded-[2rem]" : "grid gap-3"}>
        <button
          type="button"
          onClick={() => switchTurn("black")}
          className={`${gameActive ? "rounded-none p-5" : "rounded-[2rem] p-4"} border border-slate-950 bg-slate-950 text-left text-white shadow-sm`}
          aria-label="Schwarz Uhr drücken"
        >
          <span className="flex items-center justify-between text-sm font-semibold text-slate-300">
            <span>Schwarz · {blackName}</span>
            <span>{activeSide === "black" ? "⌛" : ""}</span>
          </span>
          <span className={`${gameActive ? "mt-8 text-6xl sm:text-7xl" : "mt-3 text-4xl"} block font-mono font-black tabular-nums text-white`}>{formatClock(blackTime)}</span>
          <span className="mt-4 block text-sm font-bold text-slate-300">Züge: {blackMoves}</span>
        </button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-white px-3 py-2 text-center shadow-sm">
          <button type="button" onClick={pauseResume} disabled={status === "ended"} className="rounded-2xl bg-slate-100 px-3 py-3 text-sm font-black text-slate-950 disabled:opacity-40">
            {status === "running" ? "Pause" : "Weiter"}
          </button>
          <div className="min-w-20 rounded-2xl bg-slate-950 px-3 py-2 font-mono text-sm font-black text-white" aria-label="Gesamtzeit">
            {formatTotal(elapsedMs)}
          </div>
          <button type="button" onClick={requestEnd} disabled={status === "idle" || status === "ended"} className="rounded-2xl bg-rose-100 px-3 py-3 text-sm font-black text-rose-700 disabled:opacity-40">
            Abbrechen
          </button>
        </div>

        <button
          type="button"
          onClick={() => switchTurn("white")}
          className={`${gameActive ? "rounded-none p-5" : "rounded-[2rem] p-4"} border border-slate-200 bg-slate-50 text-left shadow-sm`}
          aria-label="Weiß Uhr drücken"
        >
          <span className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Weiß · {whiteName}</span>
            <span>{activeSide === "white" ? "⌛" : ""}</span>
          </span>
          <span className={`${gameActive ? "mt-8 text-6xl sm:text-7xl" : "mt-3 text-4xl"} block font-mono font-black tabular-nums text-slate-950`}>{formatClock(whiteTime)}</span>
          <span className="mt-4 block text-sm font-bold text-slate-600">Züge: {whiteMoves}</span>
        </button>
      </div>

      {status === "flagged" ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{flaggedLabel}</p> : null}
      {resultLabel ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Ergebnis: {resultLabel}</p> : null}
      {status === "ended" ? <button type="button" onClick={reset} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Neue Partie</button> : null}

      {endStep !== "none" ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-xl">
            {endStep === "confirm" ? (
              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-950">Partie wirklich beenden?</h4>
                <p className="text-sm text-slate-600">Die Uhr ist pausiert. Bei „Nein“ läuft es weiter wie vorher.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={continueAfterCancel} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950">Nein</button>
                  <button type="button" onClick={() => setEndStep("result")} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">Ja</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-950">Wie ist es ausgegangen?</h4>
                <div className="grid gap-2">
                  {CHESS_RESULT_OPTIONS.map((option) => (
                    <button key={option.value} type="button" onClick={() => chooseResult(option.label)} className="rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-950">
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
