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
    activeBg: "bg-emerald-500/10",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  {
    dot: "bg-sky-500",
    text: "text-sky-400",
    activeBorder: "border-sky-500",
    activeBg: "bg-sky-500/10",
    badge: "bg-sky-500/20 text-sky-400",
  },
  {
    dot: "bg-amber-500",
    text: "text-amber-400",
    activeBorder: "border-amber-500",
    activeBg: "bg-amber-500/10",
    badge: "bg-amber-500/20 text-amber-400",
  },
  {
    dot: "bg-rose-500",
    text: "text-rose-400",
    activeBorder: "border-rose-500",
    activeBg: "bg-rose-500/10",
    badge: "bg-rose-500/20 text-rose-400",
  },
  {
    dot: "bg-violet-500",
    text: "text-violet-400",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-500/10",
    badge: "bg-violet-500/20 text-violet-400",
  },
  {
    dot: "bg-lime-500",
    text: "text-lime-400",
    activeBorder: "border-lime-500",
    activeBg: "bg-lime-500/10",
    badge: "bg-lime-500/20 text-lime-400",
  },
];

/** Index-ээр өнгө сонгох (давах тохиолдолд эргэлдэнэ) */
export function playerColor(index: number): PlayerColor {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
