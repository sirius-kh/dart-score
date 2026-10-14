"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/stats";

// Харанхуй дэвсгэр (#171717) дээр шалгасан хоёр өнгө (dataviz validator: бүгд PASS,
// CVD ΔE 7.7 тул шугамын үзүүрт нэр бичиж давхар таниулна)
const SERIES = [
  { key: "average", label: "Дундаж", color: "#009966" },
  { key: "firstNine", label: "Эхний 9", color: "#e17100" },
] as const;

const W = 360;
const H = 190;
const PAD = { top: 12, right: 52, bottom: 22, left: 30 };

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** Тоглоом бүрийн 3 сумны дундаж ба эхний 9-ийн хандлага (нэг тэнхлэг) */
export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-neutral-500">
        Хандлага харахад дор хаяж 2 тоглоом хэрэгтэй.
      </p>
    );
  }

  const values = points.flatMap((p) => [p.average, p.firstNine ?? p.average]);
  const lo = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10);
  const hi = Math.ceil((Math.max(...values) + 5) / 10) * 10;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * plotH;

  const pathFor = (key: "average" | "firstNine") => {
    let d = "";
    let pen = false;
    points.forEach((p, i) => {
      const v = p[key];
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const last = points[points.length - 1];
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / plotW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Тайлбар (2 цуваа тул үргэлж) */}
      <div className="flex gap-4 text-xs text-neutral-400">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="Тоглоом бүрийн дундаж ба эхний 9 сумны дунджийн хандлага"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#262626" />
              <text
                x={PAD.left - 6}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-neutral-500 text-[10px] tabular-nums"
              >
                {t}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} className="fill-neutral-500 text-[10px]">
            {formatDate(points[0].finishedAt)}
          </text>
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-neutral-500 text-[10px]">
            {formatDate(last.finishedAt)}
          </text>

          {/* Дундаж хэсгийн бүдэг дэвсгэр */}
          <path
            d={`${pathFor("average")}L${x(points.length - 1)},${y(lo)}L${x(0)},${y(lo)}Z`}
            fill={SERIES[0].color}
            opacity={0.1}
          />
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={pathFor(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Шугамын үзүүрийн цэг ба утга */}
          {SERIES.map((s, si) => {
            const v = last[s.key];
            if (v === null) return null;
            const other = last[SERIES[1 - si].key];
            // Утгууд ойрхон бол шошгыг дээш/доош бага зэрэг салгана
            const nudge = other !== null && Math.abs(y(v) - y(other)) < 12 ? (v >= other ? -6 : 6) : 0;
            return (
              <g key={s.key}>
                <circle
                  cx={x(points.length - 1)}
                  cy={y(v)}
                  r={4}
                  fill={s.color}
                  stroke="#171717"
                  strokeWidth={2}
                />
                <text
                  x={x(points.length - 1) + 8}
                  y={y(v) + nudge}
                  dy="0.32em"
                  className="fill-neutral-300 text-[10px] font-semibold tabular-nums"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          {hover !== null && hp && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="#525252"
              />
              {SERIES.map((s) => {
                const v = hp[s.key];
                return v === null ? null : (
                  <circle
                    key={s.key}
                    cx={x(hover)}
                    cy={y(v)}
                    r={4.5}
                    fill={s.color}
                    stroke="#171717"
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hover !== null && hp && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > points.length / 2 ? "-105%" : "5%"})`,
            }}
          >
            <div className="text-neutral-500">
              {formatFullDate(hp.finishedAt)} · #{hover + 1}
            </div>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-neutral-200">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}:{" "}
                <span className="font-semibold tabular-nums">
                  {hp[s.key] === null ? "—" : hp[s.key]!.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Хүснэгтээр харах (хүртээмж) */}
      <details className="text-xs text-neutral-400">
        <summary className="cursor-pointer select-none text-neutral-500 hover:text-neutral-300">
          Хүснэгтээр харах
        </summary>
        <table className="mt-2 w-full tabular-nums">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-1 text-left font-normal">Огноо</th>
              <th className="py-1 text-right font-normal">Дундаж</th>
              <th className="py-1 text-right font-normal">Эхний 9</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.gameId} className="border-t border-neutral-800">
                <td className="py-1">{formatFullDate(p.finishedAt)}</td>
                <td className="py-1 text-right">{p.average.toFixed(1)}</td>
                <td className="py-1 text-right">{p.firstNine?.toFixed(1) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
