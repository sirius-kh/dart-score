// Тоглогч бүрийг ялгах өнгөний палитр.
// Tailwind class-уудыг бүтэн бичсэн тул build үед таних (purge хийгдэхгүй).

export interface PlayerColor {
  /** Нэрний хажуугийн өнгөт цэг */
  dot: string;
  /** Үлдэгдэл оноо болон өнгөт текст */
  text: string;
  /** Идэвхтэй үеийн хүрээ */
  activeBorder: string;
  /** Идэвхтэй үеийн дэвсгэр */
  activeBg: string;
  /** "Ээлж" тэмдгийн дэвсгэр+текст */
  badge: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  {
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    activeBorder: "border-emerald-500",
    activeBg: "bg-emerald-950",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  {
    dot: "bg-sky-500",
    text: "text-sky-400",
    activeBorder: "border-sky-500",
    activeBg: "bg-sky-950",
    badge: "bg-sky-500/20 text-sky-400",
  },
  {
    dot: "bg-amber-500",
    text: "text-amber-400",
    activeBorder: "border-amber-500",
    activeBg: "bg-amber-950",
    badge: "bg-amber-500/20 text-amber-400",
  },
  {
    dot: "bg-rose-500",
    text: "text-rose-400",
    activeBorder: "border-rose-500",
    activeBg: "bg-rose-950",
    badge: "bg-rose-500/20 text-rose-400",
  },
  {
    dot: "bg-violet-500",
    text: "text-violet-400",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-950",
    badge: "bg-violet-500/20 text-violet-400",
  },
  {
    dot: "bg-lime-500",
    text: "text-lime-400",
    activeBorder: "border-lime-500",
    activeBg: "bg-lime-950",
    badge: "bg-lime-500/20 text-lime-400",
  },
  {
    dot: "bg-cyan-500",
    text: "text-cyan-400",
    activeBorder: "border-cyan-500",
    activeBg: "bg-cyan-950",
    badge: "bg-cyan-500/20 text-cyan-400",
  },
  {
    dot: "bg-orange-500",
    text: "text-orange-400",
    activeBorder: "border-orange-500",
    activeBg: "bg-orange-950",
    badge: "bg-orange-500/20 text-orange-400",
  },
  {
    dot: "bg-fuchsia-500",
    text: "text-fuchsia-400",
    activeBorder: "border-fuchsia-500",
    activeBg: "bg-fuchsia-950",
    badge: "bg-fuchsia-500/20 text-fuchsia-400",
  },
  {
    dot: "bg-teal-500",
    text: "text-teal-400",
    activeBorder: "border-teal-500",
    activeBg: "bg-teal-950",
    badge: "bg-teal-500/20 text-teal-400",
  },
];

/** Index-ээр өнгө сонгох (давах тохиолдолд эргэлдэнэ) */
export function playerColor(index: number): PlayerColor {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
