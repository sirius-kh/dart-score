// Checkout (хаалт) зөвлөмж — үлдсэн оноог 3 хүртэл сумаар хэрхэн хаахыг санал болгоно.
// Double-out дүрмийн дагуу хамгийн сүүлийн сум заавал хос (double) эсвэл bullseye (50) байна.
// Энэ нь зөвхөн зөвлөмж (hint) — цэвэр функц, side-effect-гүй.

interface Segment {
  label: string;
  value: number;
  isDouble: boolean;
}

/** Хаалтын дээд хязгаар: 170 (T20 T20 Bull) */
export const MAX_CHECKOUT = 170;

// Боломжит онох талбарууд
const SINGLES: Segment[] = Array.from({ length: 20 }, (_, i) => ({
  label: `${i + 1}`,
  value: i + 1,
  isDouble: false,
}));
const DOUBLES: Segment[] = Array.from({ length: 20 }, (_, i) => ({
  label: `D${i + 1}`,
  value: (i + 1) * 2,
  isDouble: true,
}));
const TREBLES: Segment[] = Array.from({ length: 20 }, (_, i) => ({
  label: `T${i + 1}`,
  value: (i + 1) * 3,
  isDouble: false,
}));
const BULL: Segment = { label: "25", value: 25, isDouble: false };
const BULLSEYE: Segment = { label: "Bull", value: 50, isDouble: true };

// Тохируулах (setup) сумны давуу эрэмбэ: тоглогчид ихэвчлэн treble-ээр их оноо авч,
// дараа нь сайхан хос үлдээдэг. Эрэмбийг хийморьтой (стандарт) дарааллаар өгнө.
const SETUP_ORDER: Segment[] = [
  TREBLES[19], // T20
  TREBLES[18], // T19
  TREBLES[17], // T18
  TREBLES[16], // T17
  TREBLES[15], // T16
  TREBLES[14], // T15
  TREBLES[13], // T14
  TREBLES[12], // T13
  ...TREBLES.slice(0, 12).reverse(),
  BULL,
  ...SINGLES.slice().reverse(),
  ...DOUBLES.slice().reverse(),
];

// Хаах (finishing) хосны давуу эрэмбэ: тоглогчдын дуртай хосууд эхэнд.
const FINISH_ORDER: Segment[] = [
  DOUBLES[19], // D20
  DOUBLES[15], // D16
  DOUBLES[17], // D18
  DOUBLES[9], // D10
  DOUBLES[11], // D12
  DOUBLES[7], // D8
  DOUBLES[3], // D4
  DOUBLES[1], // D2
  BULLSEYE, // 50
  ...DOUBLES.slice(),
];

function uniqueByLabel(segs: Segment[]): Segment[] {
  const seen = new Set<string>();
  const out: Segment[] = [];
  for (const s of segs) {
    if (!seen.has(s.label)) {
      seen.add(s.label);
      out.push(s);
    }
  }
  return out;
}

const SETUP = uniqueByLabel(SETUP_ORDER);
const FINISH = uniqueByLabel(FINISH_ORDER);

/**
 * Тухайн оноог хаах сумны дарааллыг олно (1–3 сум, сүүлчийнх нь хос).
 * Олдохгүй бол null. Хамгийн цөөн сумаар хаахыг урьдчилан эрэмбэлнэ.
 */
function solve(remaining: number): string[] | null {
  if (remaining < 2 || remaining > MAX_CHECKOUT) return null;

  // 1 сум: шууд хос
  for (const f of FINISH) {
    if (f.value === remaining) return [f.label];
  }

  // 2 сум: setup + хос
  for (const a of SETUP) {
    if (a.value >= remaining) continue;
    const rest = remaining - a.value;
    for (const f of FINISH) {
      if (f.value === rest) return [a.label, f.label];
    }
  }

  // 3 сум: setup + setup + хос
  for (const a of SETUP) {
    if (a.value >= remaining) continue;
    for (const b of SETUP) {
      const used = a.value + b.value;
      if (used >= remaining) continue;
      const rest = remaining - used;
      for (const f of FINISH) {
        if (f.value === rest) return [a.label, b.label, f.label];
      }
    }
  }

  return null;
}

// Урьдчилан тооцоолсон хүснэгт (2..170)
const TABLE: (string[] | null)[] = (() => {
  const t: (string[] | null)[] = new Array(MAX_CHECKOUT + 1).fill(null);
  for (let n = 2; n <= MAX_CHECKOUT; n++) t[n] = solve(n);
  return t;
})();

/**
 * Үлдсэн оноог double-out дүрмээр хаах зөвлөмжийг буцаана.
 * Хаах боломжгүй (эсвэл хүрээнээс гадуур) бол null.
 */
export function checkoutRoute(remaining: number): string[] | null {
  if (remaining < 2 || remaining > MAX_CHECKOUT) return null;
  return TABLE[remaining] ?? null;
}

/** Зөвлөмжийг "T20 T20 Bull" гэх мэт мөр болгож буцаана. */
export function checkoutHint(remaining: number): string | null {
  const route = checkoutRoute(remaining);
  return route ? route.join(" ") : null;
}

/** Тухайн оноог хосоор хаах боломжтой эсэх (double-out шалгахад). */
export function isCheckoutPossible(remaining: number): boolean {
  return checkoutRoute(remaining) !== null;
}
