"use client";

/** Дэлгэцийн голд түр гарах тэмдэглэгээ (180, bust, leg хожих) */
export interface Flash {
  /** Ижил төрлийн тэмдэглэгээ дараалан гарахад анимэйшныг дахин эхлүүлнэ */
  id: number;
  kind: "180" | "bust" | "leg";
  /** Нэмэлт мөр (жишээ нь leg хожсон тоглогчийн нэр) */
  detail?: string;
}

const STYLES: Record<Flash["kind"], { text: string; className: string }> = {
  "180": {
    text: "180!",
    className:
      "bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-8xl text-transparent",
  },
  bust: { text: "BUST", className: "text-7xl text-red-500" },
  leg: { text: "LEG!", className: "text-7xl text-brand-400" },
};

export default function FlashOverlay({
  flash,
  onDone,
}: {
  flash: Flash | null;
  onDone: () => void;
}) {
  if (!flash) return null;
  const style = STYLES[flash.kind];
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        key={flash.id}
        onAnimationEnd={onDone}
        className="flex animate-flash flex-col items-center gap-2 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
      >
        <span className={`px-4 font-black italic tracking-tight ${style.className}`}>
          {style.text}
        </span>
        {flash.detail && (
          <span className="text-xl font-bold text-neutral-100">{flash.detail}</span>
        )}
      </div>
    </div>
  );
}
