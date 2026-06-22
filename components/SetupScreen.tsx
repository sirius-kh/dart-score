"use client";

import { useState } from "react";
import type { StartingScore } from "@/lib/types";

interface SetupScreenProps {
  onStart: (playerNames: string[], startingScore: StartingScore) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [startingScore, setStartingScore] = useState<StartingScore>(501);
  const [names, setNames] = useState<string[]>(["Тоглогч 1", "Тоглогч 2"]);

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addPlayer = () => {
    setNames((prev) => [...prev, `Тоглогч ${prev.length + 1}`]);
  };

  const removePlayer = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    const cleaned = names
      .map((n, i) => n.trim() || `Тоглогч ${i + 1}`)
      .slice(0, names.length);
    onStart(cleaned, startingScore);
  };

  const canStart = names.length >= 2;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-center text-3xl font-bold">🎯 Дартсын оноо</h1>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-400">Эхлэх оноо</label>
        <div className="grid grid-cols-3 gap-2">
          {([301, 501, 701] as StartingScore[]).map((score) => (
            <button
              key={score}
              onClick={() => setStartingScore(score)}
              className={`rounded-lg border px-4 py-3 text-lg font-semibold transition ${
                startingScore === score
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-400">Тоглогчид</label>
        <div className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Тоглогч ${i + 1}`}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-500"
              />
              {names.length > 2 && (
                <button
                  onClick={() => removePlayer(i)}
                  aria-label="Тоглогч хасах"
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-neutral-400 hover:border-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addPlayer}
          className="mt-1 rounded-lg border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-neutral-500"
        >
          + Тоглогч нэмэх
        </button>
      </section>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="rounded-lg bg-emerald-600 px-4 py-3 text-lg font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Эхлүүлэх
      </button>
      {!canStart && (
        <p className="text-center text-sm text-neutral-500">
          Хамгийн багадаа 2 тоглогч хэрэгтэй.
        </p>
      )}
    </div>
  );
}
