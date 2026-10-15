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
  /** Олон тоглогчтой үед жижиг хэмжээгээр харуулна */
  compact?: boolean;
  /** Бүтэн мөр эзлэх (сондгой тооны тоглогчийн сүүлийнх) */
  wide?: boolean;
}

/** Картанд харуулах сүүлийн ээлжийн тоо */
const RECENT_TURNS = 5;

/** Онооны самбарын нэг тоглогч (DartCounter маягийн том үлдэгдэлтэй хавтан) */
export default function PlayerCard({
  player,
  isActive,
  colorIndex,
  legsToWin,
  checkout,
  compact = false,
  wide = false,
}: PlayerCardProps) {
  const avg = threeDartAverage(player);
  // Шинэ нь эхэнд
  const recent = player.turns.slice(-RECENT_TURNS).reverse();
  const color = playerColor(colorIndex);

  return (
    <div
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border transition ${
        wide ? "col-span-2" : ""
      } ${
        isActive
          ? `${color.activeBorder} bg-neutral-800 shadow-lg shadow-black/30`
          : "border-neutral-800 bg-neutral-900 opacity-80"
      }`}
    >
      {/* Идэвхтэй тоглогчийн дээд өнгөт зурвас */}
      <div className={`h-1 ${isActive ? color.dot : "bg-transparent"}`} />

      <div className={`flex flex-col gap-1 ${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 font-semibold">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
            <span className="truncate">{player.name}</span>
          </span>
          {legsToWin > 1 && (
            <span
              className="flex shrink-0 gap-1"
              title={`Хожсон leg: ${player.legsWon}/${legsToWin}`}
              aria-label={`Хожсон leg: ${player.legsWon}/${legsToWin}`}
            >
              {Array.from({ length: legsToWin }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i < player.legsWon ? "bg-brand-500" : "bg-neutral-700"
                  }`}
                />
              ))}
            </span>
          )}
        </div>

        <div
          // Үлдэгдэл өөрчлөгдөх бүрд анимэйшн тоглоно
          key={player.remaining}
          className={`origin-left animate-pop font-black leading-none tracking-tight tabular-nums ${
            compact ? "text-5xl" : "text-6xl sm:text-7xl"
          } ${isActive ? "text-neutral-50" : "text-neutral-300"}`}
        >
          {player.remaining}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-neutral-500">
          <span className="flex flex-col">
            Дундаж
            <span className="text-sm font-semibold tabular-nums text-neutral-200">
              {avg.toFixed(1)}
            </span>
          </span>
          <span className="flex flex-col">
            Сум
            <span className="text-sm font-semibold tabular-nums text-neutral-200">
              {player.dartsThrown}
            </span>
          </span>
        </div>

        {/* Сүүлийн ээлжүүд (шинэ нь зүүн талд) */}
        <div className="flex min-h-5 gap-1 overflow-hidden" aria-label="Сүүлийн ээлжүүд">
          {recent.length === 0 ? (
            <span className="text-xs text-neutral-600">—</span>
          ) : (
            recent.map((t, i) => (
              <span
                key={player.turns.length - i}
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                  i === 0 ? "bg-neutral-700 text-neutral-100" : "bg-neutral-800/70 text-neutral-500"
                }`}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {isActive && checkout && (
        <div className="flex items-center gap-2 border-t border-neutral-700 bg-brand-950 px-4 py-1.5 text-xs">
          <span className="text-brand-300/80">Хаалт</span>
          <span className="font-bold tracking-wide text-brand-400">{checkout}</span>
        </div>
      )}
    </div>
  );
}
