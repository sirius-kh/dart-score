"use client";

import { useState } from "react";
import { SCORE_BUCKETS } from "@/lib/stats";

const COLOR = "#009966";
const W = 360;
const H = 160;
const PAD = { top: 16, bottom: 20, x: 4 };
const BAR_MAX = 24;

/** 4px дугуйрсан оройтой, суурьдаа дөрвөлжин багана */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, h, w / 2);
  const b = y + h;
  return `M${x},${b}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${b}Z`;
}

/** Ээлжийн онооны мужаар хуваарилалт (нэг цуваа — тайлбаргүй, гарчиг нь нэрлэнэ) */
export default function DistributionChart({ buckets }: { buckets: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = buckets.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">Ээлж бүртгэгдээгүй.</p>;
  }

  const max = Math.max(...buckets);
  const slot = (W - PAD.x * 2) / buckets.length;
  const barW = Math.min(BAR_MAX, slot - 6);
  const plotH = H - PAD.top - PAD.bottom;
  const base = H - PAD.bottom;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        role="img"
        aria-label="Ээлжийн онооны мужаар хуваарилалт"
        onPointerLeave={() => setHover(null)}
      >
        <line x1={PAD.x} x2={W - PAD.x} y1={base} y2={base} stroke="#262626" />
        {buckets.map((count, i) => {
          const h = max === 0 ? 0 : (count / max) * plotH;
          const cx = PAD.x + slot * i + slot / 2;
          return (
            <g key={i}>
              {count > 0 && (
                <path
                  d={columnPath(cx - barW / 2, base - h, barW, h)}
                  fill={COLOR}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {count > 0 && (
                <text
                  x={cx}
                  y={base - h - 4}
                  textAnchor="middle"
                  className="fill-neutral-300 text-[10px] font-semibold tabular-nums"
                >
                  {count}
                </text>
              )}
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                className="fill-neutral-500 text-[9px] tabular-nums"
              >
                {SCORE_BUCKETS[i].min}
              </text>
              {/* Баганаас том hover бүс */}
              <rect
                x={cx - slot / 2}
                y={PAD.top - 12}
                width={slot}
                height={plotH + 12}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 shadow-lg"
          style={{
            left: `${((PAD.x + slot * hover + slot / 2) / W) * 100}%`,
            transform: `translateX(${hover >= buckets.length / 2 ? "-105%" : "5%"})`,
          }}
        >
          <div className="text-neutral-500">{SCORE_BUCKETS[hover].label} оноо</div>
          <span className="font-semibold tabular-nums">{buckets[hover]}</span> ээлж ·{" "}
          {((buckets[hover] / total) * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
