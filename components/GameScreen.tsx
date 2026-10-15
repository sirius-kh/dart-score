"use client";

import { useState } from "react";
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
  // «Дуусгах» санамсаргүй дарагдаж тоглоом устахаас сэргийлж дахин асууна
  const [confirmQuit, setConfirmQuit] = useState(false);
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

  const compact = state.players.length > 2;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-3 lg:grid lg:min-h-0 lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* Зүүн тал (утсанд дээд хэсэг): толгой + онооны самбар */}
      <div className="flex flex-col gap-3 lg:gap-4">
        <header className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-brand-500">
              {state.startingScore}
            </span>
            <span className="truncate text-xs text-neutral-400">
              {state.doubleOut ? "Double-out" : "Straight-out"}
              {state.legsToWin > 1 &&
                ` · Leg ${state.legNumber} · ${state.legsToWin} хожвол ялна`}
            </span>
          </div>
          {confirmQuit ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-neutral-300">Тоглоомыг дуусгах уу?</span>
              <button
                onClick={onQuit}
                className="rounded-lg bg-red-500/15 px-2.5 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/25"
              >
                Тийм
              </button>
              <button
                onClick={() => setConfirmQuit(false)}
                className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Үгүй
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={onToggleSound}
                aria-label={soundOn ? "Дуу унтраах" : "Дуу асаах"}
                title={soundOn ? "Дуу унтраах" : "Дуу асаах"}
                className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                {soundOn ? "🔊" : "🔇"}
              </button>
              <button
                onClick={() => setConfirmQuit(true)}
                className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400"
              >
                Дуусгах
              </button>
            </div>
          )}
        </header>

        {legWinner && (
          <div className="animate-pop rounded-xl border border-brand-500/50 bg-brand-950 px-4 py-2 text-center text-sm font-semibold text-brand-400">
            🏆 {legWinner.name} энэ leg-ийг хожлоо! Дараагийн leg эхэллээ.
          </div>
        )}
        {state.lastWasBust && (
          <div
            // Дараалсан bust бүрд анимэйшн дахин тоглоно
            key={`bust-${totalTurns}`}
            className="animate-shake rounded-xl border border-red-600/50 bg-red-950 px-4 py-2 text-center text-sm font-semibold text-red-400"
          >
            💥 Bust! Оноо хэвээр, ээлж шилжлээ.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {state.players.map((player, i) => (
            <PlayerCard
              key={player.id}
              player={player}
              isActive={i === state.currentPlayerIndex}
              colorIndex={i}
              legsToWin={state.legsToWin}
              checkout={i === state.currentPlayerIndex ? checkout : null}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Баруун тал (утсанд доод хэсэг): оруулах горим + товчлуур */}
      <div className="flex flex-1 flex-col gap-3 lg:gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1 text-sm">
          {(
            [
              ["total", "Нийт оноо"],
              ["darts", "Сум бүрээр"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => onChangeInputMode(mode)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                inputMode === mode
                  ? "bg-brand-500 text-neutral-950"
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
            remaining={current.remaining}
            doubleOut={state.doubleOut}
            onSubmit={onScore}
            onUndo={onUndo}
            canUndo={canUndo}
          />
        )}
      </div>
    </div>
  );
}
