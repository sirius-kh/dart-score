// Дууссан тоглоомын түүх ба тоглогчийн нийт статистик — цэвэр функцууд (UI-гүй).
// Тоглогчийг тоглоом хооронд **нэрээр** нь танина (id нь тоглоом бүрд шинэ).

import type { GameState, StartingScore } from "./types";
import { averageOf } from "./x01";

/** Түүхэнд хадгалах нэг тоглогчийн үр дүн */
export interface PlayerRecord {
  name: string;
  legsWon: number;
  /** Бүх leg-ийн ээлж бүрийн оноо (bust = 0) */
  turns: number[];
  /** Нийт хаясан сум */
  darts: number;
  /** Хожсон leg бүрийн хаалтын (сүүлийн) ээлжийн оноо */
  checkouts: number[];
}

/** Түүхэнд хадгалах нэг дууссан тоглоом */
export interface GameRecord {
  /** `GameState.id` — нэг тоглоомыг давхар хадгалахгүй */
  id: string;
  finishedAt: number;
  startingScore: StartingScore;
  doubleOut: boolean;
  legsToWin: number;
  winnerName: string;
  players: PlayerRecord[];
}

/** Хадгалах тоглоомын дээд тоо (localStorage-ийг дүүргэхгүйн тулд) */
export const MAX_HISTORY = 200;

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Дууссан тоглоомоос түүхийн бичлэг үүсгэнэ. Дуусаагүй бол null. */
export function buildGameRecord(state: GameState, finishedAt: number): GameRecord | null {
  if (state.phase !== "finished") return null;
  const winner = state.players.find((p) => p.id === state.winnerId);
  if (!winner) return null;

  return {
    id: state.id,
    finishedAt,
    startingScore: state.startingScore,
    doubleOut: state.doubleOut,
    legsToWin: state.legsToWin,
    winnerName: winner.name,
    players: state.players.map((p) => {
      const legs = [...p.legTurns, p.turns];
      return {
        name: p.name,
        legsWon: p.legsWon,
        turns: legs.flat(),
        darts: sum(p.legDarts) + p.dartsThrown,
        // Leg-ийг хаасан бол ээлжүүдийн нийлбэр яг эхлэх оноотой тэнцэнэ
        checkouts: legs
          .filter((t) => t.length > 0 && sum(t) === state.startingScore)
          .map((t) => t[t.length - 1]),
      };
    }),
  };
}

/** Бичлэгийг түүхэнд нэмнэ (ижил id байвал солино), шинэ нь эхэндээ */
export function addRecord(history: GameRecord[], record: GameRecord): GameRecord[] {
  return [record, ...history.filter((r) => r.id !== record.id)].slice(0, MAX_HISTORY);
}

/** Тоглогчийн бүх тоглоомын нэгтгэсэн статистик */
export interface PlayerStats {
  name: string;
  games: number;
  wins: number;
  legsWon: number;
  /** 3 сумны дундаж (нийт оноо / нийт сум × 3) */
  average: number;
  /** Нэг тоглоомын хамгийн өндөр дундаж */
  bestGameAverage: number;
  highestTurn: number;
  count180: number;
  count140: number;
  count100: number;
  /** Хамгийн өндөр хаалт */
  bestCheckout: number;
  darts: number;
}

/** Түүхээс тоглогч бүрийн статистикийг нэгтгэж, ялалт → дунджаар эрэмбэлнэ */
export function aggregateStats(history: GameRecord[]): PlayerStats[] {
  const byName = new Map<string, PlayerStats & { points: number }>();

  for (const game of history) {
    for (const p of game.players) {
      const s = byName.get(p.name) ?? {
        name: p.name,
        games: 0,
        wins: 0,
        legsWon: 0,
        average: 0,
        bestGameAverage: 0,
        highestTurn: 0,
        count180: 0,
        count140: 0,
        count100: 0,
        bestCheckout: 0,
        darts: 0,
        points: 0,
      };
      s.games += 1;
      if (p.name === game.winnerName) s.wins += 1;
      s.legsWon += p.legsWon;
      s.points += sum(p.turns);
      s.darts += p.darts;
      s.bestGameAverage = Math.max(s.bestGameAverage, averageOf(sum(p.turns), p.darts));
      for (const t of p.turns) {
        s.highestTurn = Math.max(s.highestTurn, t);
        if (t === 180) s.count180 += 1;
        else if (t >= 140) s.count140 += 1;
        else if (t >= 100) s.count100 += 1;
      }
      s.bestCheckout = Math.max(s.bestCheckout, ...p.checkouts, 0);
      byName.set(p.name, s);
    }
  }

  return [...byName.values()]
    .map(({ points, ...s }) => ({ ...s, average: averageOf(points, s.darts) }))
    .sort((a, b) => b.wins - a.wins || b.average - a.average);
}
