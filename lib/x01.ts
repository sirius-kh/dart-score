// X01 тоглоомын цэвэр логик (UI-гүй, тестлэхэд хялбар)

import type { GameState, Player, StartingScore } from "./types";

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
    dartsThrown: 0,
    legTurns: [],
    legDarts: [],
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

/** Дараагийн тоглогчийн index */
function nextIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

/** Ээлжүүдийн нийлбэрээс үлдэгдлийг дахин тооцоолно (bust = 0) */
function remainingFromTurns(startingScore: number, turns: number[]): number {
  return startingScore - turns.reduce((a, b) => a + b, 0);
}

/** Тоглогчдыг гүн хуулбарлана (immutable шинэчлэлд) */
function clonePlayers(players: Player[]): Player[] {
  return players.map((p) => ({
    ...p,
    turns: [...p.turns],
    legTurns: p.legTurns.map((t) => [...t]),
    legDarts: [...p.legDarts],
  }));
}

/**
 * Идэвхтэй тоглогчийн ээлжийг хэрэглэж шинэ төлөв буцаана.
 * Хүчингүй оноо бол төлөв өөрчлөгдөхгүй.
 */
export function applyTurn(state: GameState, scored: number): GameState {
  if (state.phase !== "playing" || !isValidScore(scored)) return state;

  const players = clonePlayers(state.players);
  const current = players[state.currentPlayerIndex];
  const outcome = evaluateTurn(current.remaining, scored, state.doubleOut);

  // Bust — оноо хэвээр, ээлжийг 0-оор тэмдэглэн дараагийн тоглогч руу шилжинэ
  if (outcome === "bust") {
    current.turns.push(0);
    current.dartsThrown += DARTS_PER_TURN;
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
    current.dartsThrown += DARTS_PER_TURN;
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
      p.turns = [];
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
  current.dartsThrown += DARTS_PER_TURN;
  return {
    ...state,
    players,
    currentPlayerIndex: nextIndex(state),
    legWinnerId: null,
    lastWasBust: false,
  };
}

/**
 * Хамгийн сүүлийн үйлдлийг буцаах (undo).
 * - Тоглоом дууссан үед: ялагчийн хожсон ээлжийг буцааж playing руу буцна.
 * - Leg шинээр эхэлсэн агшинд (хэн ч хараахан хаяагүй): өмнөх leg-ийг сэргээнэ,
 *   ингэснээр дараагийн undo нь хожсон ээлжийг буцаана.
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
    winner.dartsThrown = winner.turns.length * DARTS_PER_TURN;
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

  // Leg сая дууссан (бүх turns хоосон) — өмнөх leg-ийг бүхэлд нь сэргээнэ
  if (!hasCurrentTurns && hasArchivedLegs) {
    const players = clonePlayers(state.players);
    let winnerIndex = state.currentPlayerIndex;
    players.forEach((p, i) => {
      const turns = p.legTurns.pop() ?? [];
      p.legDarts.pop();
      p.turns = turns;
      p.dartsThrown = turns.length * DARTS_PER_TURN;
      p.remaining = remainingFromTurns(state.startingScore, turns);
      if (p.remaining === 0) {
        winnerIndex = i;
        p.legsWon = Math.max(0, p.legsWon - 1);
      }
    });
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
  target.dartsThrown = target.turns.length * DARTS_PER_TURN;
  target.remaining = remainingFromTurns(state.startingScore, target.turns);

  return {
    ...state,
    players,
    currentPlayerIndex: targetIndex,
    legWinnerId: null,
    lastWasBust: false,
  };
}

/** Тухайн ээлжүүдийн 3 сумны дундаж (нийт оноо / ээлжийн тоо) */
function average(turns: number[]): number {
  if (turns.length === 0) return 0;
  return turns.reduce((a, b) => a + b, 0) / turns.length;
}

/** Идэвхтэй leg-ийн 3 сумны дундаж */
export function threeDartAverage(player: Player): number {
  return average(player.turns);
}

/** Бүх leg-ийг нэгтгэсэн 3 сумны дундаж (тоглоомын нийт статистик) */
export function overallAverage(player: Player): number {
  const all = [...player.legTurns.flat(), ...player.turns];
  return average(all);
}

/** Тоглогчийн нийт хаясан сум (бүх leg) */
export function totalDarts(player: Player): number {
  return player.legDarts.reduce((a, b) => a + b, 0) + player.dartsThrown;
}

/** Тоглогчийн хамгийн өндөр ээлж (бүх leg) */
export function highestTurn(player: Player): number {
  const all = [...player.legTurns.flat(), ...player.turns];
  return all.length ? Math.max(...all) : 0;
}
