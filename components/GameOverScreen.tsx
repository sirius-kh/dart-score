"use client";

import type { GameState } from "@/lib/types";
import { overallAverage, totalDarts, highestTurn } from "@/lib/x01";
import { playerColor } from "@/lib/colors";
import { ChartIcon, TrophyIcon, UndoIcon } from "./Icons";

interface GameOverScreenProps {
  state: GameState;
  onUndo: () => void;
  onNewGame: () => void;
  onShowStats: () => void;
}

export default function GameOverScreen({
  state,
  onUndo,
  onNewGame,
  onShowStats,
}: GameOverScreenProps) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  // Хожсон leg, дараа нь дунджаар эрэмбэлсэн жагсаалт
  const ranked = [...state.players].sort(
    (a, b) => b.legsWon - a.legsWon || overallAverage(b) - overallAverage(a),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <TrophyIcon className="mx-auto h-12 w-12 text-brand-400" />
        <h1 className="text-3xl font-black tracking-tight text-brand-400">
          {winner?.name ?? "Тоглогч"} яллаа!
        </h1>
        {state.legsToWin > 1 && winner && (
          <p className="text-sm text-neutral-400">
            {winner.legsWon} leg хожиж тоглоомыг авлаа.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 text-left">
        {ranked.map((p) => {
          const color = playerColor(state.players.findIndex((x) => x.id === p.id));
          return (
            <div
              key={p.id}
              className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${
                p.id === state.winnerId
                  ? `${color.activeBorder} ${color.activeBg}`
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
                  <span className="truncate">{p.name}</span>
                </span>
                {state.legsToWin > 1 && (
                  <span
                    className="flex shrink-0 items-center gap-1 text-sm text-neutral-400"
                    aria-label={`Хожсон leg: ${p.legsWon}`}
                  >
                    <TrophyIcon className="h-3.5 w-3.5" /> {p.legsWon}
                  </span>
                )}
              </span>
              <span className="grid grid-cols-3 gap-2 text-[11px] text-neutral-500">
                {(
                  [
                    ["Дундаж", overallAverage(p).toFixed(1)],
                    ["Сум", totalDarts(p)],
                    ["Хамгийн их", highestTurn(p)],
                  ] as const
                ).map(([label, value]) => (
                  <span key={label} className="flex flex-col">
                    {label}
                    <span className="text-sm font-semibold tabular-nums text-neutral-200">
                      {value}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onNewGame}
          className="rounded-xl bg-brand-500 px-4 py-3.5 text-lg font-black text-neutral-950 transition hover:bg-brand-400 active:scale-[0.98]"
        >
          Дахин эхлэх
        </button>
        <button
          onClick={onShowStats}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
        >
          <ChartIcon /> Статистик ба түүх
        </button>
        <button
          onClick={onUndo}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-brand-500 hover:text-brand-400"
        >
          <UndoIcon /> Сүүлийн ээлжийг болих
        </button>
      </div>
    </div>
  );
}
