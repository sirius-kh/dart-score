// X01 тоглоомын цэвэр логик (UI-гүй, тестлэхэд хялбар)

import type { Dart, GameState, Player, StartingScore } from "./types";

/** Нэг ээлжид оруулах боломжит хамгийн их оноо (3 сум × treble 20) */
export const MAX_TURN_SCORE = 180;

/** Нэг ээлжид хаях сумны тоо (оноог 3 сумны нийлбэрээр оруулна) */
export const DARTS_PER_TURN = 3;

/** Тоглоом эхлүүлэх тохиргоо */
export interface GameOptions {
  /** Хосоор (double) хаах дүрэм идэвхтэй эсэх */
  doubleOut: boolean;
  /** Хэдэн leg хожвол тоглоомыг бүрэн хожих вэ */
  legsToWin: number;
}

/** Шинэ тоглогч үүсгэх */
export function createPlayer(name: string, startingScore: StartingScore): Player {
  return {
    id: `${name}-${startingScore}-${Math.round(performance.now() * 1000)}-${Math.floor(
      Math.random() * 1e6,
    )}`,
    name,
    remaining: startingScore,
    turns: [],
    turnDarts: [],
    turnAttempts: [],
    dartsThrown: 0,
    legTurns: [],
    legDarts: [],
    legTurnDarts: [],
    legTurnAttempts: [],
    legsWon: 0,
  };
}

/** Тоглоомыг эхлүүлэх төлөв */
export function startGame(
  playerNames: string[],
  startingScore: StartingScore,
  options: GameOptions = { doubleOut: true, legsToWin: 1 },
): GameState {
  return {
    id: `game-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
    phase: "playing",
    startingScore,
    doubleOut: options.doubleOut,
    legsToWin: Math.max(1, Math.floor(options.legsToWin)),
    legNumber: 1,
    players: playerNames.map((name) => createPlayer(name, startingScore)),
    currentPlayerIndex: 0,
    legStarterIndex: 0,
    winnerId: null,
    legWinnerId: null,
    lastWasBust: false,
  };
}

/**
 * Ээлжийн нийт оноог тухайн үлдэгдэлд хэрэглэсний үр дүн.
 * - "win": яг тэг болж ялсан
 * - "bust": сөрөг болсон, эсвэл (double-out үед) 1 үлдсэн → оноо хэвээр, ээлж шилжинэ
 * - "ok": энгийн буурал
 */
export type TurnOutcome = "win" | "bust" | "ok";

export function evaluateTurn(
  remaining: number,
  scored: number,
  doubleOut = true,
): TurnOutcome {
  const next = remaining - scored;
  if (next === 0) return "win";
  if (next < 0) return "bust";
  // Double-out үед 1 үлдвэл хосоор хаах боломжгүй тул bust
  if (doubleOut && next === 1) return "bust";
  return "ok";
}

/** Оруулсан оноо хүчинтэй эсэх (0–180 бүхэл тоо) */
export function isValidScore(scored: number): boolean {
  return Number.isInteger(scored) && scored >= 0 && scored <= MAX_TURN_SCORE;
}

/** Сумны оноо (алдсан = 0, T25 боломжгүй тул 0) */
export function dartValue(dart: Dart): number {
  if (dart.segment === 0) return 0;
  if (dart.segment === 25 && dart.multiplier === 3) return 0;
  return dart.segment * dart.multiplier;
}

/** Сумыг хосоор (double эсвэл bullseye) онох эсэх — double-out хаалтад шаардлагатай */
export function isDoubleDart(dart: Dart): boolean {
  return dart.segment !== 0 && dart.multiplier === 2;
}

/** Сумны шошго: "T20", "D16", "5", "25", "Bull", "Алдсан" */
export function dartLabel(dart: Dart): string {
  if (dart.segment === 0) return "Алдсан";
  if (dart.segment === 25) return dart.multiplier === 2 ? "Bull" : "25";
  const prefix = dart.multiplier === 3 ? "T" : dart.multiplier === 2 ? "D" : "";
  return `${prefix}${dart.segment}`;
}

/** Сум тус бүрээр үнэлсэн ээлжийн үр дүн */
export interface DartsEvaluation {
  /** "ok" бол ээлж дуусаагүй байж болно (3-аас цөөн сум) */
  outcome: TurnOutcome;
  /** Ээлжид тооцогдох оноо (bust = 0) */
  scored: number;
  /** Ээлж дуусах хүртэл хаясан сум (win/bust үед 3-аас цөөн байж болно) */
  dartsUsed: number;
  /** Нэг сумаар хаах боломжтой (хос үлдсэн) үед шидсэн сум — хаалтын хувьд */
  attempts: number;
}

/** Үлдэгдлийг нэг сумаар хосоор хаах боломжтой эсэх (D1–D20 эсвэл Bull) */
export function isOneDartFinish(remaining: number): boolean {
  return remaining === 50 || (remaining >= 2 && remaining <= 40 && remaining % 2 === 0);
}

/**
 * Ээлжийн сумнуудыг дарааллаар нь үнэлнэ. Win/bust болмогц ээлж зогсоно —
 * үлдсэн сумнууд тооцогдохгүй. Double-out үед сүүлийн сум заавал хос байх ёстой.
 */
export function evaluateDarts(
  remaining: number,
  darts: Dart[],
  doubleOut = true,
): DartsEvaluation {
  let left = remaining;
  let attempts = 0;
  for (let i = 0; i < darts.length && i < DARTS_PER_TURN; i++) {
    if (isOneDartFinish(left)) attempts += 1;
    const next = left - dartValue(darts[i]);
    if (next === 0) {
      if (!doubleOut || isDoubleDart(darts[i])) {
        return { outcome: "win", scored: remaining, dartsUsed: i + 1, attempts };
      }
      return { outcome: "bust", scored: 0, dartsUsed: i + 1, attempts };
    }
    if (next < 0 || (doubleOut && next === 1)) {
      return { outcome: "bust", scored: 0, dartsUsed: i + 1, attempts };
    }
    left = next;
  }
  return {
    outcome: "ok",
    scored: remaining - left,
    dartsUsed: Math.min(darts.length, DARTS_PER_TURN),
    attempts,
  };
}

/** Дараагийн тоглогчийн index */
function nextIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Ээлжүүдийн нийлбэрээс үлдэгдлийг дахин тооцоолно (bust = 0) */
function remainingFromTurns(startingScore: number, turns: number[]): number {
  return startingScore - sum(turns);
}

/** Тоглогчдыг гүн хуулбарлана (immutable шинэчлэлд) */
function clonePlayers(players: Player[]): Player[] {
  return players.map((p) => ({
    ...p,
    turns: [...p.turns],
    turnDarts: [...p.turnDarts],
    turnAttempts: [...p.turnAttempts],
    legTurns: p.legTurns.map((t) => [...t]),
    legDarts: [...p.legDarts],
    legTurnDarts: p.legTurnDarts.map((t) => [...t]),
    legTurnAttempts: p.legTurnAttempts.map((t) => [...t]),
  }));
}

/**
 * Үнэлсэн ээлжийг идэвхтэй тоглогчид бүртгэж шинэ төлөв буцаана.
 * `darts` — энэ ээлжид хаясан сумны тоо (1–3); `attempts` — хос руу шидсэн сум (мэдэгдэхгүй бол null).
 */
function commitTurn(
  state: GameState,
  outcome: TurnOutcome,
  scored: number,
  darts: number,
  attempts: number | null,
): GameState {
  const players = clonePlayers(state.players);
  const current = players[state.currentPlayerIndex];

  // Bust — оноо хэвээр, ээлжийг 0-оор тэмдэглэн дараагийн тоглогч руу шилжинэ
  if (outcome === "bust") {
    current.turns.push(0);
    current.turnDarts.push(darts);
    current.turnAttempts.push(attempts);
    current.dartsThrown += darts;
    return {
      ...state,
      players,
      currentPlayerIndex: nextIndex(state),
      legWinnerId: null,
      lastWasBust: true,
    };
  }

  // Win — энэ leg-ийг хожлоо
  if (outcome === "win") {
    current.remaining = 0;
    current.turns.push(scored);
    current.turnDarts.push(darts);
    current.turnAttempts.push(attempts);
    current.dartsThrown += darts;
    current.legsWon += 1;

    const gameOver = current.legsWon >= state.legsToWin;
    if (gameOver) {
      // Тоглоом бүрэн дууслаа — одоогийн leg-ийн ээлжүүд статистикт turns дотроо үлдэнэ
      return {
        ...state,
        players,
        phase: "finished",
        winnerId: current.id,
        legWinnerId: current.id,
        lastWasBust: false,
      };
    }

    // Leg хожсон ч тоглоом үргэлжилнэ — бүх тоглогчийн leg-ийг архивлаж шинэ leg эхлүүлнэ
    for (const p of players) {
      p.legTurns.push([...p.turns]);
      p.legDarts.push(p.dartsThrown);
      p.legTurnDarts.push([...p.turnDarts]);
      p.legTurnAttempts.push([...p.turnAttempts]);
      p.turns = [];
      p.turnDarts = [];
      p.turnAttempts = [];
      p.dartsThrown = 0;
      p.remaining = state.startingScore;
    }
    const newStarter = (state.legStarterIndex + 1) % players.length;
    return {
      ...state,
      players,
      legNumber: state.legNumber + 1,
      legStarterIndex: newStarter,
      currentPlayerIndex: newStarter,
      legWinnerId: current.id,
      lastWasBust: false,
    };
  }

  // Энгийн буурал
  current.remaining -= scored;
  current.turns.push(scored);
  current.turnDarts.push(darts);
  current.turnAttempts.push(attempts);
  current.dartsThrown += darts;
  return {
    ...state,
    players,
    currentPlayerIndex: nextIndex(state),
    legWinnerId: null,
    lastWasBust: false,
  };
}

/**
 * Ээлжийн нийт оноогоор (3 сум гэж үзэж) ээлж хэрэглэнэ.
 * Хүчингүй оноо бол төлөв өөрчлөгдөхгүй.
 */
export function applyTurn(state: GameState, scored: number): GameState {
  if (state.phase !== "playing" || !isValidScore(scored)) return state;
  const current = state.players[state.currentPlayerIndex];
  const outcome = evaluateTurn(current.remaining, scored, state.doubleOut);
  return commitTurn(state, outcome, scored, DARTS_PER_TURN, null);
}

/**
 * Сум тус бүрээр ээлж хэрэглэнэ. Win/bust болсон бол сумны тоо 3-аас цөөн байж болно;
 * үгүй бол яг 3 сум шаардана (дутуу ээлжийг хүлээж авахгүй).
 */
export function applyDarts(state: GameState, darts: Dart[]): GameState {
  if (state.phase !== "playing" || darts.length === 0) return state;
  const current = state.players[state.currentPlayerIndex];
  const result = evaluateDarts(current.remaining, darts, state.doubleOut);
  if (result.outcome === "ok" && result.dartsUsed < DARTS_PER_TURN) return state;
  return commitTurn(
    state,
    result.outcome,
    result.scored,
    result.dartsUsed,
    state.doubleOut ? result.attempts : null,
  );
}

/**
 * Хамгийн сүүлийн үйлдлийг буцаах (undo).
 * - Тоглоом дууссан үед: ялагчийн хожсон ээлжийг буцааж playing руу буцна.
 * - Leg шинээр эхэлсэн агшинд (хэн ч хараахан хаяагүй): өмнөх leg-ийг сэргээж,
 *   хожсон ээлжийг нь буцаана (ялагч дахин ээлжтэй болно).
 * - Бусад үед: сүүлд ээлжээ хийсэн тоглогчийн ээлжийг буцаана.
 */
export function undoLastTurn(state: GameState): GameState {
  const n = state.players.length;
  const hasCurrentTurns = state.players.some((p) => p.turns.length > 0);
  const hasArchivedLegs = state.players.some((p) => p.legTurns.length > 0);

  // Юу ч хийгдээгүй бол өөрчлөхгүй
  if (!hasCurrentTurns && !hasArchivedLegs) return state;

  // Тоглоом дууссан — ялагч сүүлийн (хожсон) ээлжээ хийсэн
  if (state.phase === "finished") {
    const players = clonePlayers(state.players);
    const winner = players[state.currentPlayerIndex];
    if (winner.turns.length === 0) return state;
    winner.turns.pop();
    winner.turnDarts.pop();
    winner.turnAttempts.pop();
    winner.dartsThrown = sum(winner.turnDarts);
    winner.remaining = remainingFromTurns(state.startingScore, winner.turns);
    winner.legsWon = Math.max(0, winner.legsWon - 1);
    return {
      ...state,
      players,
      phase: "playing",
      winnerId: null,
      legWinnerId: null,
      lastWasBust: false,
    };
  }

  // Leg сая дууссан (бүх turns хоосон) — өмнөх leg-ийг сэргээж, хожсон ээлжийг буцаана
  if (!hasCurrentTurns && hasArchivedLegs) {
    const players = clonePlayers(state.players);
    let winnerIndex = state.currentPlayerIndex;
    players.forEach((p, i) => {
      const turns = p.legTurns.pop() ?? [];
      p.legDarts.pop();
      p.turns = turns;
      p.turnDarts = p.legTurnDarts.pop() ?? [];
      p.turnAttempts = p.legTurnAttempts.pop() ?? [];
      p.dartsThrown = sum(p.turnDarts);
      p.remaining = remainingFromTurns(state.startingScore, turns);
      if (p.remaining === 0) {
        winnerIndex = i;
        p.legsWon = Math.max(0, p.legsWon - 1);
      }
    });
    const winner = players[winnerIndex];
    winner.turns.pop();
    winner.turnDarts.pop();
    winner.turnAttempts.pop();
    winner.dartsThrown = sum(winner.turnDarts);
    winner.remaining = remainingFromTurns(state.startingScore, winner.turns);
    const prevStarter = (state.legStarterIndex - 1 + n) % n;
    return {
      ...state,
      players,
      legNumber: Math.max(1, state.legNumber - 1),
      legStarterIndex: prevStarter,
      currentPlayerIndex: winnerIndex,
      legWinnerId: null,
      lastWasBust: false,
    };
  }

  // Энгийн undo — сүүлд ээлжээ хийсэн тоглогч = одоогийн идэвхтэйгээс өмнөх
  const targetIndex = (state.currentPlayerIndex - 1 + n) % n;
  const players = clonePlayers(state.players);
  const target = players[targetIndex];
  if (target.turns.length === 0) return state;
  target.turns.pop();
  target.turnDarts.pop();
  target.turnAttempts.pop();
  target.dartsThrown = sum(target.turnDarts);
  target.remaining = remainingFromTurns(state.startingScore, target.turns);

  return {
    ...state,
    players,
    currentPlayerIndex: targetIndex,
    legWinnerId: null,
    lastWasBust: false,
  };
}

/** 3 сумны дундаж = нийт оноо / хаясан сум × 3 */
export function averageOf(points: number, darts: number): number {
  return darts === 0 ? 0 : (points / darts) * DARTS_PER_TURN;
}

/** Идэвхтэй leg-ийн 3 сумны дундаж */
export function threeDartAverage(player: Player): number {
  return averageOf(sum(player.turns), player.dartsThrown);
}

/** Бүх leg-ийг нэгтгэсэн 3 сумны дундаж (тоглоомын нийт статистик) */
export function overallAverage(player: Player): number {
  const points = sum(player.legTurns.flat()) + sum(player.turns);
  return averageOf(points, totalDarts(player));
}

/** Тоглогчийн нийт хаясан сум (бүх leg) */
export function totalDarts(player: Player): number {
  return sum(player.legDarts) + player.dartsThrown;
}

/** Тоглогчийн хамгийн өндөр ээлж (бүх leg) */
export function highestTurn(player: Player): number {
  const all = [...player.legTurns.flat(), ...player.turns];
  return all.length ? Math.max(...all) : 0;
}
