"use client";

import { useState } from "react";
import { MAX_TURN_SCORE, isValidScore } from "@/lib/x01";

interface ScoreInputProps {
  playerName: string;
  onSubmit: (scored: number) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function ScoreInput({
  playerName,
  onSubmit,
  onUndo,
  canUndo,
}: ScoreInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const scored = Number(value);
    if (value.trim() === "" || !isValidScore(scored)) {
      setError(`0–${MAX_TURN_SCORE} хооронд бүхэл тоо оруулна уу.`);
      return;
    }
    onSubmit(scored);
    setValue("");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-neutral-400">
        <span className="font-semibold text-neutral-200">{playerName}</span>-ийн ээлжийн
        нийт оноо
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_TURN_SCORE}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="0–180"
          autoFocus
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-2xl font-bold tabular-nums outline-none focus:border-emerald-500"
        />
        <button
          onClick={submit}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-lg font-bold text-white transition hover:bg-emerald-500"
        >
          Бүртгэх
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Түргэн товчлуурууд */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 26, 41, 45, 60, 81, 100, 140].map((q) => (
          <button
            key={q}
            onClick={() => {
              onSubmit(q);
              setValue("");
              setError(null);
            }}
            className="rounded-lg border border-neutral-700 px-2 py-2 text-sm text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
          >
            {q}
          </button>
        ))}
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
