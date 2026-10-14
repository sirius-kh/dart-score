"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useWakeLock } from "@/hooks/useWakeLock";
import type { Dart, GameState, InputMode, StartingScore } from "@/lib/types";
import {
  applyDarts,
  applyTurn,
  dartValue,
  evaluateDarts,
  evaluateTurn,
  isValidScore,
  startGame,
  undoLastTurn,
  type GameOptions,
  type TurnOutcome,
} from "@/lib/x01";
import { addRecord, buildGameRecord, recentNames, type GameRecord } from "@/lib/history";
import { playBust, playWin, speakScore } from "@/lib/sounds";
import SetupScreen from "@/components/SetupScreen";
import GameScreen from "@/components/GameScreen";
import GameOverScreen from "@/components/GameOverScreen";
import StatsScreen from "@/components/StatsScreen";
import FlashOverlay, { type Flash } from "@/components/FlashOverlay";

// v3: тоглоомын id, ээлж бүрийн сумны тоо (turnDarts) нэмэгдсэнээр GameState-ийн бүтэц
// өөрчлөгдсөн тул түлхүүрийг шинэчилж, нийцгүй хуучин хадгалсан тоглоомыг үл хэрэгснэ.
const STORAGE_KEY = "dart-score:game:v3";
const HISTORY_KEY = "dart-score:history";

const INITIAL_STATE: GameState = {
  id: "",
  phase: "setup",
  startingScore: 501,
  doubleOut: true,
  legsToWin: 1,
  legNumber: 1,
  players: [],
  currentPlayerIndex: 0,
  legStarterIndex: 0,
  winnerId: null,
  legWinnerId: null,
  lastWasBust: false,
};

const EMPTY_HISTORY: GameRecord[] = [];

export default function Home() {
  const [state, setState, hydrated] = useLocalStorage<GameState>(
    STORAGE_KEY,
    INITIAL_STATE,
  );
  const [soundOn, setSoundOn] = useLocalStorage<boolean>("dart-score:sound", true);
  const [inputMode, setInputMode] = useLocalStorage<InputMode>(
    "dart-score:input-mode",
    "total",
  );
  const [history, setHistory] = useLocalStorage<GameRecord[]>(HISTORY_KEY, EMPTY_HISTORY);
  const [showStats, setShowStats] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  // Тоглоомын үед утасны дэлгэц унтрахгүй
  useWakeLock(hydrated && state.phase === "playing");

  const handleStart = (
    names: string[],
    startingScore: StartingScore,
    options: GameOptions,
  ) => {
    setState(startGame(names, startingScore, options));
  };

  // Ээлжийн үр дүнгийн дуу (хэрэглэгчийн товшилтын дараа дуудагдана)
  const playTurnSounds = (scored: number, outcome: TurnOutcome) => {
    if (!soundOn) return;
    speakScore(scored);
    if (outcome === "win") playWin();
    else if (outcome === "bust") playBust();
  };

  // Ээлжийн үр дүнгийн дэлгэцийн тэмдэглэгээ (тоглоом дуусахад GameOver дэлгэц өөрөө харагдана)
  const showFlash = (scored: number, outcome: TurnOutcome, next: GameState) => {
    const id = Date.now();
    if (outcome === "bust") setFlash({ id, kind: "bust" });
    else if (outcome === "win" && next.phase === "playing") {
      const winner = next.players.find((p) => p.id === next.legWinnerId);
      setFlash({ id, kind: "leg", detail: winner?.name });
    } else if (scored === 180) setFlash({ id, kind: "180" });
  };

  // Шинэ төлөвийг хадгалж, тоглоом дуусвал түүхэнд бичнэ
  const commit = (next: GameState) => {
    if (next === state) return;
    setState(next);
    const record = buildGameRecord(next, Date.now());
    if (record) setHistory((h) => addRecord(h, record));
  };

  const handleScore = (scored: number) => {
    if (state.phase !== "playing" || !isValidScore(scored)) return;
    const current = state.players[state.currentPlayerIndex];
    const outcome = evaluateTurn(current.remaining, scored, state.doubleOut);
    const next = applyTurn(state, scored);
    playTurnSounds(scored, outcome);
    showFlash(scored, outcome, next);
    commit(next);
  };

  const handleDarts = (darts: Dart[]) => {
    if (state.phase !== "playing") return;
    const current = state.players[state.currentPlayerIndex];
    const result = evaluateDarts(current.remaining, darts, state.doubleOut);
    // Нийт оноо горимтой адил: bust үед ч хаясан сумнуудын нийлбэрийг дуудна
    const thrown = darts
      .slice(0, result.dartsUsed)
      .reduce((a, d) => a + dartValue(d), 0);
    const next = applyDarts(state, darts);
    playTurnSounds(thrown, result.outcome);
    showFlash(thrown, result.outcome, next);
    commit(next);
  };

  const handleUndo = () => {
    // Дууссан тоглоомыг буцаавал түүхээс хасна (дахин дуусахад шинээр бичигдэнэ)
    if (state.phase === "finished") {
      setHistory((h) => h.filter((r) => r.id !== state.id));
    }
    setState(undoLastTurn(state));
  };

  const handleNewGame = () => {
    setState(INITIAL_STATE);
  };

  const openStats = () => setShowStats(true);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <FlashOverlay flash={flash} onDone={() => setFlash(null)} />
      {/* Hydrate болохоос өмнө layout-ийн үсрэлтийг багасгана */}
      {!hydrated ? (
        <div className="text-neutral-500">Уншиж байна…</div>
      ) : showStats ? (
        <StatsScreen
          history={history}
          onBack={() => setShowStats(false)}
          onDeleteGame={(id) => setHistory((h) => h.filter((r) => r.id !== id))}
          onClearAll={() => setHistory(EMPTY_HISTORY)}
        />
      ) : state.phase === "setup" ? (
        <SetupScreen
          lastGame={history[0]}
          recentNames={recentNames(history)}
          onStart={handleStart}
          onShowStats={openStats}
        />
      ) : state.phase === "playing" ? (
        <GameScreen
          state={state}
          onScore={handleScore}
          onDarts={handleDarts}
          inputMode={inputMode}
          onChangeInputMode={setInputMode}
          onUndo={handleUndo}
          onQuit={handleNewGame}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
        />
      ) : (
        <GameOverScreen
          state={state}
          onUndo={handleUndo}
          onNewGame={handleNewGame}
          onShowStats={openStats}
        />
      )}
    </main>
  );
}
