// X01 тоглоомын цэвэр логик (UI-гүй, тестлэхэд хялбар)

import type { GameState, Player, StartingScore } from "./types";

/** Нэг ээлжид оруулах боломжит хамгийн их оноо (3 сум × treble 20) */
export const MAX_TURN_SCORE = 180;

/** Шинэ тоглогч үүсгэх */
export function createPlayer(name: string, startingScore: StartingScore): Player {
  return {
    id: `${name}-${startingScore}-${Math.round(performance.now() * 1000)}-${Math.floor(
      Math.random() * 1e6,
    )}`,
    name,
    remaining: startingScore,
    turns: [],
  };
}

/** Тоглоомыг эхлүүлэх төлөв */
export function startGame(playerNames: string[], startingScore: StartingScore): GameState {
  return {
    phase: "playing",
    startingScore,
    players: playerNames.map((name) => createPlayer(name, startingScore)),
    currentPlayerIndex: 0,
    winnerId: null,
  };
}

/**
 * Ээлжийн нийт оноог тухайн үлдэгдэлд хэрэглэсний үр дүн.
 * - "win": яг тэг болж ялсан
 * - "bust": сөрөг болсон эсвэл 1 үлдсэн → оноо хэвээр, ээлж шилжинэ
 * - "ok": энгийн буурал
 */
export type TurnOutcome = "win" | "bust" | "ok";

export function evaluateTurn(remaining: number, scored: number): TurnOutcome {
  const next = remaining - scored;
  if (next === 0) return "win";
  // 1 үлдвэл double-out хийх боломжгүй тул bust; мөн сөрөг бол bust
  if (next < 0 || next === 1) return "bust";
  return "ok";
}

/** Оруулсан оноо хүчинтэй эсэх (0–180 бүхэл тоо) */
export function isValidScore(scored: number): boolean {
  return Number.isInteger(scored) && scored >= 0 && scored <= MAX_TURN_SCORE;
}

/** Дараагийн тоглогчийн index */
function nextIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

/**
 * Идэвхтэй тоглогчийн ээлжийг хэрэглэж шинэ төлөв буцаана.
 * Хүчингүй оноо бол төлөв өөрчлөгдөхгүй.
 */
export function applyTurn(state: GameState, scored: number): GameState {
  if (state.phase !== "playing" || !isValidScore(scored)) return state;

  const players = state.players.map((p) => ({ ...p, turns: [...p.turns] }));
  const current = players[state.currentPlayerIndex];
  const outcome = evaluateTurn(current.remaining, scored);

  if (outcome === "win") {
    current.remaining = 0;
    current.turns.push(scored);
    return {
      ...state,
      players,
      phase: "finished",
      winnerId: current.id,
    };
  }

  if (outcome === "bust") {
    // Оноо хэвээр, гэхдээ ээлжийг 0-оор тэмдэглэн дараагийн тоглогч руу шилжүүлнэ
    current.turns.push(0);
    return {
      ...state,
      players,
      currentPlayerIndex: nextIndex(state),
    };
  }

  current.remaining -= scored;
  current.turns.push(scored);
  return {
    ...state,
    players,
    currentPlayerIndex: nextIndex(state),
  };
}

/**
 * Хамгийн сүүлийн ээлжийг буцаах (undo).
 * Сүүлд ээлж бүртгэсэн тоглогчийг идэвхтэй болгож, түүний оноог сэргээнэ.
 */
export function undoLastTurn(state: GameState): GameState {
  if (state.players.every((p) => p.turns.length === 0)) return state;

  // Сүүлд ээлжээ бүртгэсэн тоглогч = одоогийн идэвхтэйгээс өмнөх
  const prevIndex =
    (state.currentPlayerIndex - 1 + state.players.length) % state.players.length;

  // finished үед ялагч өөрөө сүүлийн ээлжийг хийсэн (index хэвээр)
  const targetIndex = state.phase === "finished" ? state.currentPlayerIndex : prevIndex;

  const players = state.players.map((p) => ({ ...p, turns: [...p.turns] }));
  const target = players[targetIndex];
  if (target.turns.length === 0) return state;

  const lastScore = target.turns.pop()!;
  // bust ээлж 0-оор бүртгэгдсэн тул remaining-г өөрчлөөгүй; энгийн ээлжийг сэргээнэ
  target.remaining += lastScore;

  return {
    ...state,
    players,
    phase: "playing",
    winnerId: null,
    currentPlayerIndex: targetIndex,
  };
}

/** 3 сумны дундаж (нийт оноо / ээлжийн тоо) */
export function threeDartAverage(player: Player): number {
  if (player.turns.length === 0) return 0;
  const total = player.turns.reduce((a, b) => a + b, 0);
  return total / player.turns.length;
}
