"use client";

import type { Player } from "@/lib/types";
import { threeDartAverage } from "@/lib/x01";
import { playerColor } from "@/lib/colors";

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  /** Тоглогчийн дараалал — өнгө сонгоход ашиглана */
  colorIndex: number;
  /** Тоглоом хожих leg-ийн тоо (1 бол leg тоологч харуулахгүй) */
  legsToWin: number;
  /** Хосоор хаах зөвлөмж (зөвхөн идэвхтэй тоглогчид, боломжтой үед) */
  checkout?: string | null;
}

export default function PlayerCard({
  player,
  isActive,
  colorIndex,
  legsToWin,
  checkout,
}: PlayerCardProps) {
  const avg = threeDartAverage(player);
  const lastTurn = player.turns.at(-1);
  const color = playerColor(colorIndex);

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 transition ${
        isActive
          ? `${color.activeBorder} ${color.activeBg} shadow-lg`
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 truncate text-lg font-semibold">
          <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
          {player.name}
        </span>
        <span className="flex items-center gap-2">
          {legsToWin > 1 && (
            <span
              className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300"
              title="Хожсон leg"
            >
              🏆 {player.legsWon}/{legsToWin}
            </span>
          )}
          {isActive && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color.badge}`}>
              Ээлж
            </span>
          )}
        </span>
      </div>
      <div
        // Үлдэгдэл өөрчлөгдөх бүрд анимэйшн тоглоно
        key={player.remaining}
        className={`origin-left animate-pop text-4xl font-bold tabular-nums ${color.text}`}
      >
        {player.remaining}
      </div>
      <div className="flex gap-4 text-xs text-neutral-500">
        <span>Ээлж: {player.turns.length}</span>
        <span>Дундаж: {avg.toFixed(1)}</span>
        {lastTurn !== undefined && (
          <span>
            Сүүлд: <span className="font-semibold text-neutral-300">{lastTurn}</span>
          </span>
        )}
      </div>
      {isActive && checkout && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Хаалт:</span>
          <span className="font-semibold tracking-wide text-amber-400">{checkout}</span>
        </div>
      )}
    </div>
  );
}
