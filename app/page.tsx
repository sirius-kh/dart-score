"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { GameState, StartingScore } from "@/lib/types";
import { applyTurn, evaluateTurn, isValidScore, startGame, undoLastTurn } from "@/lib/x01";
import { playBust, playWin, speakScore } from "@/lib/sounds";
import SetupScreen from "@/components/SetupScreen";
import GameScreen from "@/components/GameScreen";
import GameOverScreen from "@/components/GameOverScreen";

const STORAGE_KEY = "dart-score:game";

const INITIAL_STATE: GameState = {
  phase: "setup",
  startingScore: 501,
  players: [],
  currentPlayerIndex: 0,
  winnerId: null,
};

export default function Home() {
  const [state, setState, hydrated] = useLocalStorage<GameState>(
    STORAGE_KEY,
    INITIAL_STATE,
  );
  const [soundOn, setSoundOn] = useLocalStorage<boolean>("dart-score:sound", true);

  const handleStart = (names: string[], startingScore: StartingScore) => {
    setState(startGame(names, startingScore));
  };

  const handleScore = (scored: number) => {
    // Дуу: оноо хэрэглэхээс өмнө үр дүнг тооцоолж тохирох дууг тоглуулна
    if (soundOn && state.phase === "playing" && isValidScore(scored)) {
      const current = state.players[state.currentPlayerIndex];
      const outcome = evaluateTurn(current.remaining, scored);
      // Оруулсан оноог дуугаар хэлнэ
      speakScore(scored);
      // Bust/ялалтын үед нэмэлт эффект дуу
      if (outcome === "win") playWin();
      else if (outcome === "bust") playBust();
    }
    setState((prev) => applyTurn(prev, scored));
  };

  const handleUndo = () => {
    setState((prev) => undoLastTurn(prev));
  };

  const handleNewGame = () => {
    setState(INITIAL_STATE);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      {/* Hydrate болохоос өмнө layout-ийн үсрэлтийг багасгана */}
      {!hydrated ? (
        <div className="text-neutral-500">Уншиж байна…</div>
      ) : state.phase === "setup" ? (
        <SetupScreen onStart={handleStart} />
      ) : state.phase === "playing" ? (
        <GameScreen
          state={state}
          onScore={handleScore}
          onUndo={handleUndo}
          onQuit={handleNewGame}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
        />
      ) : (
        <GameOverScreen state={state} onUndo={handleUndo} onNewGame={handleNewGame} />
      )}
    </main>
  );
}
