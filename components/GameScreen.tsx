"use client";

import type { GameState } from "@/lib/types";
import PlayerCard from "./PlayerCard";
import ScoreInput from "./ScoreInput";

interface GameScreenProps {
  state: GameState;
  onScore: (scored: number) => void;
  onUndo: () => void;
  onQuit: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function GameScreen({
  state,
  onScore,
  onUndo,
  onQuit,
  soundOn,
  onToggleSound,
}: GameScreenProps) {
  const current = state.players[state.currentPlayerIndex];
  const canUndo = state.players.some((p) => p.turns.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 {state.startingScore}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            aria-label={soundOn ? "Дуу унтраах" : "Дуу асаах"}
            title={soundOn ? "Дуу унтраах" : "Дуу асаах"}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-500"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={onQuit}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:border-red-500 hover:text-red-400"
          >
            Дуусгах
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {state.players.map((player, i) => (
          <PlayerCard
            key={player.id}
            player={player}
            isActive={i === state.currentPlayerIndex}
            colorIndex={i}
          />
        ))}
      </div>

      <ScoreInput
        playerName={current.name}
        onSubmit={onScore}
        onUndo={onUndo}
        canUndo={canUndo}
      />
    </div>
  );
}
