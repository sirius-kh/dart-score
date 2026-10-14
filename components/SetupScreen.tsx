"use client";

import { useState } from "react";
import type { StartingScore } from "@/lib/types";
import type { GameOptions } from "@/lib/x01";
import type { GameRecord } from "@/lib/history";

interface SetupScreenProps {
  onStart: (
    playerNames: string[],
    startingScore: StartingScore,
    options: GameOptions,
  ) => void;
  onShowStats: () => void;
  /** Хамгийн сүүлд дууссан тоглоом — тохиргоог урьдчилан бөглөхөд */
  lastGame?: GameRecord;
  /** Сүүлд тоглосон тоглогчдын нэр (хурдан сонгох) */
  recentNames: string[];
}

const defaultName = (i: number) => `Тоглогч ${i + 1}`;
const isDefaultName = (name: string) => /^Тоглогч \d+$/.test(name.trim()) || !name.trim();

export default function SetupScreen({
  onStart,
  onShowStats,
  lastGame,
  recentNames,
}: SetupScreenProps) {
  // Сүүлийн тоглоомын тохиргоог анхны утга болгоно (дахин тоглоход хурдан)
  const [startingScore, setStartingScore] = useState<StartingScore>(
    lastGame?.startingScore ?? 501,
  );
  const [doubleOut, setDoubleOut] = useState(lastGame?.doubleOut ?? true);
  const [legsToWin, setLegsToWin] = useState(lastGame?.legsToWin ?? 1);
  const [names, setNames] = useState<string[]>(
    lastGame ? lastGame.players.map((p) => p.name) : [defaultName(0), defaultName(1)],
  );

  const suggestions = recentNames.filter(
    (n) => !isDefaultName(n) && !names.some((m) => m.trim() === n),
  );

  // Санал болгосон нэрийг эхний хоосон/анхдагч нэртэй мөрөнд, эсвэл шинэ мөрөнд оруулна
  const pickName = (name: string) => {
    setNames((prev) => {
      const slot = prev.findIndex(isDefaultName);
      return slot === -1 ? [...prev, name] : prev.map((n, i) => (i === slot ? name : n));
    });
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addPlayer = () => {
    setNames((prev) => [...prev, defaultName(prev.length)]);
  };

  const removePlayer = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    const cleaned = names
      .map((n, i) => n.trim() || defaultName(i))
      .slice(0, names.length);
    onStart(cleaned, startingScore, { doubleOut, legsToWin });
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
        <label className="text-sm font-medium text-neutral-400">Хаах дүрэм</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDoubleOut(true)}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
              doubleOut
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            Хосоор хаах
            <span className="block text-xs font-normal opacity-70">
              Double-out
            </span>
          </button>
          <button
            onClick={() => setDoubleOut(false)}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
              !doubleOut
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            Энгийн хаалт
            <span className="block text-xs font-normal opacity-70">
              Straight-out
            </span>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-400">
          Хэдэн leg хожвол ялах вэ
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 5].map((legs) => (
            <button
              key={legs}
              onClick={() => setLegsToWin(legs)}
              className={`rounded-lg border px-3 py-3 text-lg font-semibold transition ${
                legsToWin === legs
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {legs}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {legsToWin === 1
            ? "Нэг leg — эхэлж хаасан нь ялна."
            : `Эхэлж ${legsToWin} leg хожсон тоглогч ялна.`}
        </p>
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
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((n) => (
              <button
                key={n}
                onClick={() => pickName(n)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
              >
                + {n}
              </button>
            ))}
          </div>
        )}
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

      <button
        onClick={onShowStats}
        className="self-center rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
      >
        📊 Статистик ба түүх
      </button>
    </div>
  );
}
