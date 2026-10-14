// Dashboard-ын статистик — түүхийн бичлэгээс тоглогч бүрийн үзүүлэлтийг шүүж тооцоолно.
// Цэвэр функцууд (UI-гүй). Хуучин бичлэгт `legs` байхгүй бол зөвхөн нийт үзүүлэлтэд орно.

import type { StartingScore } from "./types";
import type { GameRecord, PlayerRecord } from "./history";
import { averageOf } from "./x01";

export type Period = "week" | "month" | "year" | "all";

export const PERIOD_DAYS: Record<Exclude<Period, "all">, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ээлжийн онооны мужууд (DartCounter-ийн "3-dart range distribution") */
export const SCORE_BUCKETS = [
  { label: "0–19", min: 0, max: 19 },
  { label: "20–39", min: 20, max: 39 },
  { label: "40–59", min: 40, max: 59 },
  { label: "60–79", min: 60, max: 79 },
  { label: "80–99", min: 80, max: 99 },
  { label: "100–119", min: 100, max: 119 },
  { label: "120–139", min: 120, max: 139 },
  { label: "140–159", min: 140, max: 159 },
  { label: "160–179", min: 160, max: 179 },
  { label: "180", min: 180, max: 180 },
];

/** Эхний 9 сум = leg-ийн эхний 3 ээлж */
const FIRST_NINE_TURNS = 3;

export interface StatsFilter {
  player: string;
  period: Period;
  startingScore: StartingScore | "all";
}

export interface PlayerSummary {
  games: number;
  wins: number;
  /** 3 сумны дундаж (тоглоом байхгүй бол null) */
  average: number | null;
  /** Эхний 9 сумны дундаж */
  firstNine: number | null;
  /** Хаалтын хувь (0–100); хос руу шидсэн сум бүртгэгдээгүй бол null */
  checkoutRate: number | null;
  checkoutHits: number;
  checkoutAttempts: number;
  /** Хамгийн цөөн сумаар хаасан leg */
  bestLeg: number | null;
  /** Хаасан leg-д дунджаар зарцуулсан сум */
  dartsPerLeg: number | null;
  legsWon: number;
  highestTurn: number;
  bestCheckout: number;
  count180: number;
  count140: number;
  count100: number;
  /** `SCORE_BUCKETS` тус бүрт орсон ээлжийн тоо */
  buckets: number[];
}

export interface TrendPoint {
  gameId: string;
  finishedAt: number;
  average: number;
  firstNine: number | null;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Тоглоом шүүлтүүрт (тоглогч, эхлэх оноо, хугацааны цонх) тохирох эсэх */
function matches(
  game: GameRecord,
  filter: StatsFilter,
  from: number,
  to: number,
): PlayerRecord | undefined {
  if (game.finishedAt < from || game.finishedAt >= to) return undefined;
  if (filter.startingScore !== "all" && game.startingScore !== filter.startingScore) {
    return undefined;
  }
  return game.players.find((p) => p.name === filter.player);
}

/** Шүүлтүүрийн хугацааны цонх [from, to). `offset` = 1 бол өмнөх ижил урттай үе. */
export function periodWindow(period: Period, now: number, offset = 0): [number, number] {
  if (period === "all") return offset === 0 ? [0, Infinity] : [0, 0];
  const len = PERIOD_DAYS[period] * DAY_MS;
  return [now - len * (offset + 1), offset === 0 ? Infinity : now - len * offset];
}

/** Тоглогчийн нэг тоглоомын эхний 9 сумны оноо ба сум */
function firstNineOf(p: PlayerRecord): { points: number; darts: number } {
  let points = 0;
  let darts = 0;
  for (const leg of p.legs ?? []) {
    points += sum(leg.turns.slice(0, FIRST_NINE_TURNS));
    darts += sum(leg.darts.slice(0, FIRST_NINE_TURNS));
  }
  return { points, darts };
}

export function summarize(
  history: GameRecord[],
  filter: StatsFilter,
  now: number,
  offset = 0,
): PlayerSummary {
  const [from, to] = periodWindow(filter.period, now, offset);
  const s: PlayerSummary = {
    games: 0,
    wins: 0,
    average: null,
    firstNine: null,
    checkoutRate: null,
    checkoutHits: 0,
    checkoutAttempts: 0,
    bestLeg: null,
    dartsPerLeg: null,
    legsWon: 0,
    highestTurn: 0,
    bestCheckout: 0,
    count180: 0,
    count140: 0,
    count100: 0,
    buckets: SCORE_BUCKETS.map(() => 0),
  };
  let points = 0;
  let darts = 0;
  let f9Points = 0;
  let f9Darts = 0;
  let wonLegDarts = 0;
  let wonLegs = 0;

  for (const game of history) {
    const p = matches(game, filter, from, to);
    if (!p) continue;
    s.games += 1;
    if (game.winnerName === p.name) s.wins += 1;
    s.legsWon += p.legsWon;
    points += sum(p.turns);
    darts += p.darts;
    s.bestCheckout = Math.max(s.bestCheckout, ...p.checkouts, 0);

    for (const t of p.turns) {
      s.highestTurn = Math.max(s.highestTurn, t);
      if (t === 180) s.count180 += 1;
      else if (t >= 140) s.count140 += 1;
      else if (t >= 100) s.count100 += 1;
      const b = SCORE_BUCKETS.findIndex((r) => t >= r.min && t <= r.max);
      if (b !== -1) s.buckets[b] += 1;
    }

    const f9 = firstNineOf(p);
    f9Points += f9.points;
    f9Darts += f9.darts;

    for (const leg of p.legs ?? []) {
      // Хаалтын хувь: зөвхөн хос руу шидсэн сум бүртгэгдсэн ээлжүүдээс
      leg.attempts.forEach((a, i) => {
        if (a === null) return;
        s.checkoutAttempts += a;
        if (leg.won && i === leg.turns.length - 1) s.checkoutHits += 1;
      });
      if (leg.won) {
        const legDarts = sum(leg.darts);
        wonLegs += 1;
        wonLegDarts += legDarts;
        s.bestLeg = s.bestLeg === null ? legDarts : Math.min(s.bestLeg, legDarts);
      }
    }
  }

  if (darts > 0) s.average = averageOf(points, darts);
  if (f9Darts > 0) s.firstNine = averageOf(f9Points, f9Darts);
  if (s.checkoutAttempts > 0) {
    s.checkoutRate = (s.checkoutHits / s.checkoutAttempts) * 100;
  }
  if (wonLegs > 0) s.dartsPerLeg = wonLegDarts / wonLegs;
  return s;
}

/** Тоглоом бүрийн дундаж (хуучнаас шинэ рүү) — хандлагын график */
export function trend(history: GameRecord[], filter: StatsFilter, now: number): TrendPoint[] {
  const [from, to] = periodWindow(filter.period, now);
  const points: TrendPoint[] = [];
  for (const game of history) {
    const p = matches(game, filter, from, to);
    if (!p || p.darts === 0) continue;
    const f9 = firstNineOf(p);
    points.push({
      gameId: game.id,
      finishedAt: game.finishedAt,
      average: averageOf(sum(p.turns), p.darts),
      firstNine: f9.darts > 0 ? averageOf(f9.points, f9.darts) : null,
    });
  }
  return points.sort((a, b) => a.finishedAt - b.finishedAt);
}

/** Өмнөх үетэй харьцуулсан өөрчлөлт (%) — аль нэг нь байхгүй бол null */
export function changePct(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Түүхэнд байгаа тоглогчдын нэр — хамгийн их тоглосноос нь эхлэн */
export function playerNames(history: GameRecord[]): string[] {
  const counts = new Map<string, number>();
  for (const g of history) for (const p of g.players) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
}
