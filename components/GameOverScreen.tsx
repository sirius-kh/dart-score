"use client";

import type { GameState } from "@/lib/types";
import { overallAverage, totalDarts, highestTurn } from "@/lib/x01";
import { playerColor } from "@/lib/colors";

interface GameOverScreenProps {
  state: GameState;
  onUndo: () => void;
  onNewGame: () => void;
}

export default function GameOverScreen({ state, onUndo, onNewGame }: GameOverScreenProps) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  // Хожсон leg, дараа нь дунджаар эрэмбэлсэн жагсаалт
  const ranked = [...state.players].sort(
    (a, b) => b.legsWon - a.legsWon || overallAverage(b) - overallAverage(a),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <span className="text-5xl">🏆</span>
        <h1 className="text-2xl font-bold text-emerald-400">
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
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                p.id === state.winnerId
                  ? `${color.activeBorder} ${color.activeBg}`
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
                {p.name}
                {state.legsToWin > 1 && (
                  <span className="text-xs font-normal text-neutral-500">
                    🏆 {p.legsWon}
                  </span>
                )}
              </span>
              <span className="text-right text-xs text-neutral-400">
                дундаж {overallAverage(p).toFixed(1)} · {totalDarts(p)} сум · их{" "}
                {highestTurn(p)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onNewGame}
          className="rounded-lg bg-emerald-600 px-4 py-3 text-lg font-bold text-white transition hover:bg-emerald-500"
        >
          Дахин эхлэх
        </button>
        <button
          onClick={onUndo}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-amber-500 hover:text-amber-400"
        >
          ↩ Сүүлийн ээлжийг болих
        </button>
      </div>
    </div>
  );
}
