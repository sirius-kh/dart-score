"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TURN_SCORE, isValidScore } from "@/lib/x01";

interface ScoreInputProps {
  playerName: string;
  onSubmit: (scored: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** Хосоор хаах зөвлөмж (байвал) */
  checkout?: string | null;
}

const QUICK_SCORES = [0, 26, 41, 45, 60, 81, 100, 140];
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Ээлжийн нийт оноо оруулах. Утсанд системийн гар гаргахгүйн тулд апп доторх тоон
 * товчлуур ашиглана; компьютер дээр гараас (0–9, Backspace, Enter) бичиж болно.
 */
export default function ScoreInput({
  playerName,
  onSubmit,
  onUndo,
  canUndo,
  checkout,
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

  const keyClass =
    "rounded-lg border border-neutral-700 bg-neutral-900 py-2.5 text-xl font-semibold tabular-nums text-neutral-200 transition hover:border-emerald-500 active:bg-emerald-500/20";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          <span className="font-semibold text-neutral-200">{playerName}</span>-ийн ээлжийн
          нийт оноо
        </span>
      </div>
      {checkout && (
        <p className="text-sm text-amber-400">
          💡 Хаах зам: <span className="font-semibold tracking-wide">{checkout}</span>
        </p>
      )}

      {/* Оруулж буй утга */}
      <div
        aria-live="polite"
        className={`rounded-lg border bg-neutral-900 px-4 py-2 text-right text-4xl font-bold tabular-nums ${
          error ? "border-red-500/70" : "border-neutral-700"
        }`}
      >
        {value === "" ? <span className="text-neutral-600">0–180</span> : value}
      </div>
      {error && <p className="-mt-1 text-sm text-red-400">{error}</p>}

      {/* Түргэн товчлуурууд */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_SCORES.map((q) => (
          <button
            key={q}
            onClick={() => submitScore(q)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Тоон товчлуур */}
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((d) => (
          <button key={d} onClick={() => typeDigit(d)} className={keyClass}>
            {d}
          </button>
        ))}
        <button onClick={backspace} aria-label="Арилгах" className={keyClass}>
          ⌫
        </button>
        <button onClick={() => typeDigit("0")} className={keyClass}>
          0
        </button>
        <button
          onClick={submit}
          className="rounded-lg bg-emerald-600 py-2.5 text-lg font-bold text-white transition hover:bg-emerald-500"
        >
          Бүртгэх
        </button>
      </div>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="self-start rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 transition hover:border-amber-500 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ↩ Болих (сүүлийн ээлж)
      </button>
    </div>
  );
}
