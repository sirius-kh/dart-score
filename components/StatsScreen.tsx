"use client";

import { useMemo, useState } from "react";
import type { GameRecord } from "@/lib/history";
import { aggregateStats } from "@/lib/history";
import {
  changePct,
  periodWindow,
  playerNames,
  summarize,
  trend,
  type Period,
  type StatsFilter,
} from "@/lib/stats";
import type { StartingScore } from "@/lib/types";
import { averageOf } from "@/lib/x01";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import TrendChart from "./charts/TrendChart";
import DistributionChart from "./charts/DistributionChart";
import { ChartIcon, TrophyIcon } from "./Icons";

interface StatsScreenProps {
  history: GameRecord[];
  onBack: () => void;
  onDeleteGame: (id: string) => void;
  onClearAll: () => void;
}

const PERIODS: { value: Period; label: string; prev: string }[] = [
  { value: "week", label: "7 хоног", prev: "өмнөх 7 хоногоос" },
  { value: "month", label: "Сар", prev: "өмнөх сараас" },
  { value: "year", label: "Жил", prev: "өмнөх жилээс" },
  { value: "all", label: "Бүгд", prev: "" },
];
const SCORES: (StartingScore | "all")[] = ["all", 301, 501, 701];
const GAMES_PREVIEW = 8;

// Шүүлтүүр нь энэ төхөөрөмжид санагдана (player "" = хамгийн их тоглосон)
const DEFAULT_FILTER: StatsFilter = { player: "", period: "all", startingScore: "all" };

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Өөрчлөлтийн тэмдэг: сум + тэмдэг + хувь (өнгө дангаараа утга илэрхийлэхгүй) */
function Delta({ pct, lowerIsBetter = false }: { pct: number | null; lowerIsBetter?: boolean }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  const flat = Math.abs(pct) < 0.05;
  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        flat ? "text-neutral-500" : good ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {flat ? "→" : pct > 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Tile({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span className="text-xl font-semibold text-neutral-100">{value}</span>
      <span className="flex min-h-4 items-center gap-2 text-[11px] text-neutral-500">
        {delta}
        {sub}
      </span>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-brand-500 bg-brand-500/15 text-brand-300"
          : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}

const fmt = (v: number | null, digits = 1) => (v === null ? "—" : v.toFixed(digits));

export default function StatsScreen({
  history,
  onBack,
  onDeleteGame,
  onClearAll,
}: StatsScreenProps) {
  const [saved, setFilter] = useLocalStorage<StatsFilter>(
    "dart-score:stats-filter",
    DEFAULT_FILTER,
  );
  // Дэлгэц нээгдсэн агшин — хугацааны шүүлтүүрийн суурь
  const [now] = useState(() => Date.now());

  const names = useMemo(() => playerNames(history), [history]);
  const player = names.includes(saved.player) ? saved.player : (names[0] ?? "");
  const filter = useMemo<StatsFilter>(() => ({ ...saved, player }), [saved, player]);
  const periodInfo = PERIODS.find((p) => p.value === filter.period) ?? PERIODS[3];

  const current = useMemo(
    () => summarize(history, filter, now),
    [history, filter, now],
  );
  const previous = useMemo(
    () => (filter.period === "all" ? null : summarize(history, filter, now, 1)),
    [history, filter, now],
  );
  const points = useMemo(
    () => trend(history, filter, now),
    [history, filter, now],
  );
  const leaderboard = useMemo(() => aggregateStats(history), [history]);

  const delta = (a: number | null, b: number | null | undefined) =>
    previous ? changePct(a, b ?? null) : null;

  const [from] = periodWindow(filter.period, now);
  const games = history.filter(
    (g) =>
      g.finishedAt >= from &&
      (filter.startingScore === "all" || g.startingScore === filter.startingScore),
  );

  const [showAll, setShowAll] = useState(false);
  const visibleGames = showAll ? games : games.slice(0, GAMES_PREVIEW);

  const update = (patch: Partial<StatsFilter>) => setFilter({ ...filter, ...patch });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ChartIcon className="h-5 w-5 text-brand-500" /> Статистик
        </h1>
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
          {/* Шүүлтүүр — нэг дор */}
          <section className="flex flex-col gap-2">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {names.map((n) => (
                <Pill key={n} active={n === player} onClick={() => update({ player: n })}>
                  {n}
                </Pill>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map((p) => (
                <Pill
                  key={p.value}
                  active={filter.period === p.value}
                  onClick={() => update({ period: p.value })}
                >
                  {p.label}
                </Pill>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SCORES.map((s) => (
                <Pill
                  key={s}
                  active={filter.startingScore === s}
                  onClick={() => update({ startingScore: s })}
                >
                  {s === "all" ? "Бүх оноо" : s}
                </Pill>
              ))}
            </div>
          </section>

          {current.games === 0 ? (
            <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-500">
              {player} энэ шүүлтүүрээр тоглоогүй байна.
            </p>
          ) : (
            <>
              {/* Гол үзүүлэлт */}
              <section className="flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <span className="text-xs text-neutral-500">3 сумны дундаж</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-neutral-50">
                    {fmt(current.average)}
                  </span>
                  <Delta pct={delta(current.average, previous?.average)} />
                </div>
                <span className="text-xs text-neutral-500">
                  {current.games} тоглоом · {current.wins} ялалт (
                  {Math.round((current.wins / current.games) * 100)}%)
                  {previous && previous.games > 0 ? ` · ${periodInfo.prev}` : ""}
                </span>
              </section>

              <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Tile
                  label="Эхний 9 сум"
                  value={fmt(current.firstNine)}
                  delta={<Delta pct={delta(current.firstNine, previous?.firstNine)} />}
                />
                <Tile
                  label="Хаалтын хувь"
                  value={current.checkoutRate === null ? "—" : `${fmt(current.checkoutRate)}%`}
                  sub={
                    current.checkoutRate === null
                      ? "Хос руу шидэлт бүртгэгдээгүй"
                      : `${current.checkoutHits}/${current.checkoutAttempts}`
                  }
                  delta={<Delta pct={delta(current.checkoutRate, previous?.checkoutRate)} />}
                />
                <Tile
                  label="Шилдэг leg"
                  value={current.bestLeg === null ? "—" : `${current.bestLeg} сум`}
                  delta={
                    <Delta pct={delta(current.bestLeg, previous?.bestLeg)} lowerIsBetter />
                  }
                />
                <Tile
                  label="Сум / leg"
                  value={fmt(current.dartsPerLeg)}
                  sub={`${current.legsWon} leg хожсон`}
                  delta={
                    <Delta
                      pct={delta(current.dartsPerLeg, previous?.dartsPerLeg)}
                      lowerIsBetter
                    />
                  }
                />
                <Tile label="Их хаалт" value={current.bestCheckout ? `${current.bestCheckout}` : "—"} />
                <Tile label="Их ээлж" value={`${current.highestTurn}`} />
              </section>

              <section className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    ["180", current.count180],
                    ["140+", current.count140],
                    ["100+", current.count100],
                  ] as const
                ).map(([label, n]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 py-2"
                  >
                    <div className="text-lg font-semibold text-neutral-100">{n}</div>
                    <div className="text-[11px] text-neutral-500">{label}</div>
                  </div>
                ))}
              </section>

              <section className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <h2 className="text-sm font-medium text-neutral-300">Хандлага</h2>
                <TrendChart points={points} />
              </section>

              <section className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <h2 className="text-sm font-medium text-neutral-300">Ээлжийн онооны хуваарилалт</h2>
                <DistributionChart buckets={current.buckets} />
              </section>
            </>
          )}

          {/* Бүх тоглогч (шүүлтүүргүй) */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-400">Тоглогчид</h2>
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
              <table className="w-full text-sm">
                <thead className="text-[11px] text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-normal">Нэр</th>
                    <th className="px-2 py-2 text-right font-normal">Ялалт</th>
                    <th className="px-2 py-2 text-right font-normal">Дундаж</th>
                    <th className="px-3 py-2 text-right font-normal">180</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {leaderboard.map((s) => (
                    <tr
                      key={s.name}
                      onClick={() => update({ player: s.name })}
                      className={`cursor-pointer border-t border-neutral-800 hover:bg-neutral-800/60 ${
                        s.name === player ? "bg-brand-950" : ""
                      }`}
                    >
                      <td className="max-w-32 truncate px-3 py-2 font-medium text-neutral-200">
                        {s.name}
                      </td>
                      <td className="px-2 py-2 text-right text-neutral-300">
                        {s.wins}/{s.games}
                      </td>
                      <td className="px-2 py-2 text-right text-neutral-300">
                        {s.average.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-300">{s.count180}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-400">
              Тоглоомууд ({games.length})
            </h2>
            {visibleGames.map((g) => (
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
                      className={`flex items-center gap-1 ${
                        p.name === g.winnerName
                          ? "font-semibold text-brand-400"
                          : "text-neutral-300"
                      }`}
                    >
                      {p.name === g.winnerName && <TrophyIcon className="h-3.5 w-3.5" />}
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

          {games.length > visibleGames.length && (
            <button
              onClick={() => setShowAll(true)}
              className="-mt-2 rounded-lg border border-neutral-800 bg-neutral-900 py-2 text-sm text-neutral-400 hover:border-neutral-600"
            >
              Цааш харах ({games.length - visibleGames.length})
            </button>
          )}

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
