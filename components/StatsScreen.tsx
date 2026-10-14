"use client";

import { useMemo } from "react";
import { aggregateStats, type GameRecord } from "@/lib/history";
import { averageOf } from "@/lib/x01";

interface StatsScreenProps {
  history: GameRecord[];
  onBack: () => void;
  onDeleteGame: (id: string) => void;
  onClearAll: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span className="font-semibold tabular-nums text-neutral-200">{value}</span>
    </div>
  );
}

export default function StatsScreen({
  history,
  onBack,
  onDeleteGame,
  onClearAll,
}: StatsScreenProps) {
  const stats = useMemo(() => aggregateStats(history), [history]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📊 Статистик</h1>
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-500"
        >
          ← Буцах
        </button>
      </div>

      {history.length === 0 ? (
        <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
          Дууссан тоглоом алга. Тоглоом дуусмагц энд автоматаар хадгалагдана.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-400">Тоглогчид</h2>
            {stats.map((s) => (
              <div
                key={s.name}
                className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="truncate text-lg font-semibold">{s.name}</span>
                  <span className="text-sm text-neutral-400">
                    {s.wins}/{s.games} ялалт ·{" "}
                    {Math.round((s.wins / s.games) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <Stat label="Дундаж" value={s.average.toFixed(1)} />
                  <Stat label="Шилдэг" value={s.bestGameAverage.toFixed(1)} />
                  <Stat label="Их ээлж" value={s.highestTurn} />
                  <Stat label="Их хаалт" value={s.bestCheckout || "—"} />
                  <Stat label="180" value={s.count180} />
                  <Stat label="140+" value={s.count140} />
                  <Stat label="100+" value={s.count100} />
                  <Stat label="Хожсон leg" value={s.legsWon} />
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-400">
              Сүүлийн тоглоомууд ({history.length})
            </h2>
            {history.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {formatDate(g.finishedAt)} · {g.startingScore}
                    {g.doubleOut ? " · double-out" : ""}
                    {g.legsToWin > 1 ? ` · ${g.legsToWin} leg` : ""}
                  </span>
                  <button
                    onClick={() => onDeleteGame(g.id)}
                    aria-label="Тоглоом устгах"
                    className="rounded px-1.5 text-neutral-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                {g.players.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span
                      className={
                        p.name === g.winnerName
                          ? "font-semibold text-emerald-400"
                          : "text-neutral-300"
                      }
                    >
                      {p.name === g.winnerName ? "🏆 " : ""}
                      {p.name}
                      {g.legsToWin > 1 && (
                        <span className="ml-1 text-xs text-neutral-500">({p.legsWon})</span>
                      )}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-400">
                      дундаж{" "}
                      {averageOf(
                        p.turns.reduce((a, b) => a + b, 0),
                        p.darts,
                      ).toFixed(1)}{" "}
                      · {p.darts} сум
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <button
            onClick={() => {
              if (window.confirm("Бүх түүхийг устгах уу?")) onClearAll();
            }}
            className="self-center rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-500 hover:border-red-500 hover:text-red-400"
          >
            Бүх түүхийг устгах
          </button>
        </>
      )}
    </div>
  );
}
