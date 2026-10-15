"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TURN_SCORE, evaluateTurn, isValidScore } from "@/lib/x01";
import { isCheckoutPossible } from "@/lib/checkout";
import { UndoIcon } from "./Icons";

interface ScoreInputProps {
  playerName: string;
  /** Идэвхтэй тоглогчийн үлдэгдэл — урьдчилсан үр дүн, хаах товчид */
  remaining: number;
  doubleOut: boolean;
  onSubmit: (scored: number) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const QUICK_SCORES = [0, 26, 41, 45, 60, 81, 100, 140];
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Ээлжийн нийт оноо оруулах. Утсанд системийн гар гаргахгүйн тулд апп доторх тоон
 * товчлуур ашиглана; компьютер дээр гараас (0–9, Backspace, Enter) бичиж болно.
 */
export default function ScoreInput({
  playerName,
  remaining,
  doubleOut,
  onSubmit,
  onUndo,
  canUndo,
}: ScoreInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const typeDigit = (d: string) => {
    const next = value === "0" ? d : value + d;
    if (Number(next) > MAX_TURN_SCORE) {
      setError(`Хамгийн ихдээ ${MAX_TURN_SCORE}.`);
      return;
    }
    setValue(next);
    setError(null);
  };

  const backspace = () => {
    setValue((v) => v.slice(0, -1));
    setError(null);
  };

  const submitScore = (scored: number) => {
    onSubmit(scored);
    setValue("");
    setError(null);
  };

  const submit = () => {
    const scored = Number(value);
    if (value === "" || !isValidScore(scored)) {
      setError(`0–${MAX_TURN_SCORE} хооронд оноо оруулна уу.`);
      return;
    }
    submitScore(scored);
  };

  // Гарын товчлуур — сүүлийн render-ийн handler-уудыг ref-ээр дуудна
  const keyHandlers = useRef({ typeDigit, backspace, submit });
  useEffect(() => {
    keyHandlers.current = { typeDigit, backspace, submit };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const h = keyHandlers.current;
      if (/^[0-9]$/.test(e.key)) h.typeDigit(e.key);
      else if (e.key === "Backspace") h.backspace();
      else if (e.key === "Enter") h.submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // OK дарахаас өмнө оруулж буй оноо ямар үр дүнд хүргэхийг харуулна
  const preview = value === "" ? null : evaluateTurn(remaining, Number(value), doubleOut);

  // Үлдэгдлийг нэг ээлжээр хаах боломжтой бол сүүлийн түргэн товчийг «Хаах» болгоно
  const canFinish = doubleOut ? isCheckoutPossible(remaining) : remaining <= MAX_TURN_SCORE;
  const quickScores = canFinish ? QUICK_SCORES.slice(0, -1) : QUICK_SCORES;

  const keyClass =
    "rounded-xl bg-neutral-800 py-2 lg:py-4 text-2xl font-bold tabular-nums text-neutral-100 transition hover:bg-neutral-700 active:scale-95 active:bg-neutral-600";

  return (
    <div className="flex flex-1 flex-col gap-2">
      {/* Оруулж буй утга: тоглогчийн нэр + оноо нэг мөрөнд */}
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border bg-neutral-900 px-4 py-2 ${
          error ? "border-red-500/70" : "border-neutral-800"
        }`}
      >
        <span className="flex min-w-0 flex-col text-sm text-neutral-400">
          <span className="truncate font-semibold text-neutral-200">{playerName}</span>
          <span className="text-xs tabular-nums">
            {preview === "bust" ? (
              <span className="font-semibold text-red-400">Bust болно</span>
            ) : preview === "win" ? (
              <span className="font-semibold text-emerald-400">Хаалт!</span>
            ) : (
              <>
                Үлдэх:{" "}
                <span className="font-semibold text-neutral-200">
                  {remaining - Number(value)}
                </span>
              </>
            )}
          </span>
        </span>
        <span aria-live="polite" className="text-4xl font-black tabular-nums">
          {value === "" ? <span className="text-neutral-700">0</span> : value}
        </span>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Түргэн товчлуурууд */}
      <div className="grid grid-cols-4 gap-2">
        {quickScores.map((q) => (
          <button
            key={q}
            onClick={() => submitScore(q)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 py-2 text-sm font-semibold tabular-nums text-neutral-300 transition hover:border-brand-500 hover:text-brand-400 active:scale-95"
          >
            {q}
          </button>
        ))}
        {canFinish && (
          <button
            onClick={() => submitScore(remaining)}
            aria-label={`Хаах: ${remaining}`}
            className="rounded-lg border border-brand-500 bg-brand-500/15 py-2 text-sm font-bold tabular-nums text-brand-400 transition hover:bg-brand-500/25 active:scale-95"
          >
            ✓ {remaining}
          </button>
        )}
      </div>

      {/* Тоон товчлуур */}
      <div className="grid flex-1 grid-cols-3 grid-rows-[repeat(4,minmax(3rem,1fr))] gap-2 lg:flex-none lg:grid-rows-none">
        {DIGITS.map((d) => (
          <button key={d} onClick={() => typeDigit(d)} className={keyClass}>
            {d}
          </button>
        ))}
        <button
          onClick={backspace}
          aria-label="Арилгах"
          className={`${keyClass} text-neutral-400`}
        >
          ⌫
        </button>
        <button onClick={() => typeDigit("0")} className={keyClass}>
          0
        </button>
        <button
          onClick={submit}
          className="rounded-xl bg-brand-500 py-2 text-xl lg:py-4 font-black text-neutral-950 transition hover:bg-brand-400 active:scale-95"
        >
          OK
        </button>
      </div>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 py-2.5 text-sm font-medium text-neutral-400 transition hover:border-brand-500 hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UndoIcon /> Болих (сүүлийн ээлж)
      </button>
    </div>
  );
}
