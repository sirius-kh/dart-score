"use client";

import { useState } from "react";
import type { Dart, Multiplier } from "@/lib/types";
import { DARTS_PER_TURN, dartLabel, dartValue, evaluateDarts } from "@/lib/x01";
import { checkoutRoute } from "@/lib/checkout";
import { LightbulbIcon, UndoIcon } from "./Icons";

interface DartPadProps {
  playerName: string;
  /** Идэвхтэй тоглогчийн ээлж эхлэхийн өмнөх үлдэгдэл */
  remaining: number;
  doubleOut: boolean;
  /** Ээлж дууссан (3 сум, эсвэл win/bust) үед дуудагдана */
  onSubmit: (darts: Dart[]) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const MULTIPLIERS: { value: Multiplier; label: string }[] = [
  { value: 1, label: "Single" },
  { value: 2, label: "Double" },
  { value: 3, label: "Treble" },
];

const SEGMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function DartPad({
  playerName,
  remaining,
  doubleOut,
  onSubmit,
  onUndo,
  canUndo,
}: DartPadProps) {
  const [darts, setDarts] = useState<Dart[]>([]);
  const [multiplier, setMultiplier] = useState<Multiplier>(1);

  const scoredSoFar = darts.reduce((a, d) => a + dartValue(d), 0);
  const left = remaining - scoredSoFar;
  const dartsLeft = DARTS_PER_TURN - darts.length;

  // Үлдсэн сумаар хаах боломжтой бол зөвлөмж харуулна
  const route = doubleOut ? checkoutRoute(left) : null;
  const hint = route && route.length <= dartsLeft ? route.join(" ") : null;

  const throwDart = (segment: number) => {
    const dart: Dart = { segment, multiplier: segment === 0 ? 1 : multiplier };
    const next = [...darts, dart];
    setMultiplier(1);
    const result = evaluateDarts(remaining, next, doubleOut);
    if (result.outcome !== "ok" || next.length >= DARTS_PER_TURN) {
      setDarts([]);
      onSubmit(next);
    } else {
      setDarts(next);
    }
  };

  // Ээлж дотор оруулсан сум байвал түүнийг, үгүй бол өмнөх ээлжийг буцаана
  const undo = () => {
    if (darts.length > 0) setDarts((d) => d.slice(0, -1));
    else onUndo();
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          <span className="font-semibold text-neutral-200">{playerName}</span>-ийн сумнууд
        </span>
        <span className="tabular-nums">
          Үлдэх: <span className="font-semibold text-neutral-200">{left}</span>
        </span>
      </div>

      {/* Энэ ээлжийн 3 сум */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: DARTS_PER_TURN }, (_, i) => (
          <div
            key={i}
            className={`rounded-lg border px-2 py-2 text-center text-lg font-bold tabular-nums ${
              darts[i]
                ? "border-brand-500/60 bg-brand-500/10 text-brand-300"
                : i === darts.length
                  ? "border-neutral-500 text-neutral-600"
                  : "border-neutral-800 text-neutral-700"
            }`}
          >
            {darts[i] ? dartLabel(darts[i]) : `${i + 1}`}
          </div>
        ))}
        <div className="rounded-lg border border-neutral-800 px-2 py-2 text-center text-lg font-bold tabular-nums text-neutral-300">
          {scoredSoFar}
        </div>
      </div>

      {hint && (
        <p className="flex items-center gap-1.5 rounded-lg bg-brand-950 px-3 py-1.5 text-sm text-brand-300">
          <LightbulbIcon /> Хаах зам: <span className="font-semibold tracking-wide">{hint}</span>
        </p>
      )}

      {/* Үржүүлэгч */}
      <div className="grid grid-cols-3 gap-2">
        {MULTIPLIERS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMultiplier((cur) => (cur === m.value ? 1 : m.value))}
            aria-pressed={multiplier === m.value}
            className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
              multiplier === m.value
                ? m.value === 3
                  ? "border-rose-500 bg-rose-500/15 text-rose-400"
                  : m.value === 2
                    ? "border-amber-500 bg-amber-500/15 text-amber-400"
                    : "border-neutral-300 bg-neutral-700 text-neutral-50"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Талбарууд */}
      <div className="grid flex-1 grid-cols-5 grid-rows-[repeat(4,minmax(2.75rem,1fr))] gap-2 lg:flex-none lg:grid-rows-none">
        {SEGMENTS.map((n) => (
          <button
            key={n}
            onClick={() => throwDart(n)}
            className="rounded-xl bg-neutral-800 py-2 text-lg lg:py-3.5 font-bold tabular-nums text-neutral-100 transition hover:bg-neutral-700 active:scale-95 active:bg-neutral-600"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => throwDart(25)}
          disabled={multiplier === 3}
          className="rounded-xl bg-neutral-800 py-3.5 font-bold text-neutral-100 transition hover:bg-neutral-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {multiplier === 2 ? "Bull (50)" : "25"}
        </button>
        <button
          onClick={() => throwDart(0)}
          className="rounded-xl bg-neutral-800 py-3.5 font-bold text-neutral-400 transition hover:bg-red-500/15 hover:text-red-400 active:scale-95"
        >
          Алдсан
        </button>
      </div>

      <button
        onClick={undo}
        disabled={darts.length === 0 && !canUndo}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 py-2.5 text-sm font-medium text-neutral-400 transition hover:border-brand-500 hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UndoIcon /> {darts.length > 0 ? "Болих (сүүлийн сум)" : "Болих (сүүлийн ээлж)"}
      </button>
    </div>
  );
}
