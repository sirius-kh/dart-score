"use client";

import type { Dart, GameState, InputMode } from "@/lib/types";
import { checkoutHint } from "@/lib/checkout";
import PlayerCard from "./PlayerCard";
import ScoreInput from "./ScoreInput";
import DartPad from "./DartPad";

interface GameScreenProps {
  state: GameState;
  onScore: (scored: number) => void;
  onDarts: (darts: Dart[]) => void;
  inputMode: InputMode;
  onChangeInputMode: (mode: InputMode) => void;
  onUndo: () => void;
  onQuit: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function GameScreen({
  state,
  onScore,
  onDarts,
  inputMode,
  onChangeInputMode,
  onUndo,
  onQuit,
  soundOn,
  onToggleSound,
}: GameScreenProps) {
  const current = state.players[state.currentPlayerIndex];
  // Хэн нэгэн ээлжээ хийсэн (энэ leg-д), эсвэл өмнөх leg байгаа бол undo боломжтой
  const canUndo =
    state.players.some((p) => p.turns.length > 0) ||
    state.players.some((p) => p.legTurns.length > 0);

  const totalTurns = state.players.reduce((n, p) => n + p.turns.length, 0);

  // Идэвхтэй тоглогчийн хосоор хаах зөвлөмж (double-out үед)
  const checkout = state.doubleOut ? checkoutHint(current.remaining) : null;

  // Leg хожсон ялагчийн нэр (leg хооронд түр харуулна)
  const legWinner =
    state.legWinnerId != null
      ? state.players.find((p) => p.id === state.legWinnerId)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          🎯 {state.startingScore}
          {state.legsToWin > 1 && (
            <span className="ml-2 text-sm font-medium text-neutral-500">
              Leg {state.legNumber}
            </span>
          )}
        </h1>
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

      {legWinner && (
        <div className="animate-pop rounded-lg border border-emerald-600/50 bg-emerald-950 px-4 py-2 text-center text-sm font-semibold text-emerald-400">
          🏆 {legWinner.name} энэ leg-ийг хожлоо! Дараагийн leg эхэллээ.
        </div>
      )}
      {state.lastWasBust && (
        <div
          // Дараалсан bust бүрд анимэйшн дахин тоглоно
          key={`bust-${totalTurns}`}
          className="animate-shake rounded-lg border border-red-600/50 bg-red-950 px-4 py-2 text-center text-sm font-semibold text-red-400">
          💥 Bust! Оноо хэвээр, ээлж шилжлээ.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {state.players.map((player, i) => (
          <PlayerCard
            key={player.id}
            player={player}
            isActive={i === state.currentPlayerIndex}
            colorIndex={i}
            legsToWin={state.legsToWin}
            checkout={i === state.currentPlayerIndex ? checkout : null}
          />
        ))}
      </div>

      {/* Оруулах горим: ээлжийн нийт оноо эсвэл сум тус бүр */}
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-sm">
        {(
          [
            ["total", "Нийт оноо"],
            ["darts", "Сум бүрээр"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => onChangeInputMode(mode)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              inputMode === mode
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {inputMode === "darts" ? (
        <DartPad
          // Тоглогч солигдоход (undo гэх мэт) дутуу оруулсан сумнууд цэвэрлэгдэнэ
          key={`${state.legNumber}-${state.currentPlayerIndex}-${current.turns.length}`}
          playerName={current.name}
          remaining={current.remaining}
          doubleOut={state.doubleOut}
          onSubmit={onDarts}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      ) : (
        <ScoreInput
          playerName={current.name}
          onSubmit={onScore}
          onUndo={onUndo}
          canUndo={canUndo}
          checkout={checkout}
        />
      )}
    </div>
  );
}
