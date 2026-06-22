"use client";

import type { Player } from "@/lib/types";
import { threeDartAverage } from "@/lib/x01";
import { playerColor } from "@/lib/colors";

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  /** Тоглогчийн дараалал — өнгө сонгоход ашиглана */
  colorIndex: number;
}

export default function PlayerCard({ player, isActive, colorIndex }: PlayerCardProps) {
  const avg = threeDartAverage(player);
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
        {isActive && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color.badge}`}>
            Ээлж
          </span>
        )}
      </div>
      <div className={`text-4xl font-bold tabular-nums ${color.text}`}>
        {player.remaining}
      </div>
      <div className="flex gap-4 text-xs text-neutral-500">
        <span>Ээлж: {player.turns.length}</span>
        <span>Дундаж: {avg.toFixed(1)}</span>
      </div>
    </div>
  );
}
