// Дартсын X01 тоглоомын төрлүүд

export type StartingScore = 301 | 501 | 701;

export type GamePhase = "setup" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  /** Идэвхтэй leg-ийн үлдсэн оноо (тэг рүү буурна) */
  remaining: number;
  /** Идэвхтэй leg-ийн ээлж бүрийн нийт оноо (bust = 0) */
  turns: number[];
  /** Идэвхтэй leg-ийн ээлж бүрд хаясан сумны тоо (`turns`-тай зэрэгцээ, 1–3) */
  turnDarts: number[];
  /** Идэвхтэй leg-д хаясан нийт сум (bust ээлжийг оруулна) */
  dartsThrown: number;
  /** Дууссан leg бүрийн ээлжүүд (бүх тоглоомын статистикт) */
  legTurns: number[][];
  /** Дууссан leg бүрд хаясан сумны тоо */
  legDarts: number[];
  /** Дууссан leg бүрийн ээлж тус бүрийн сумны тоо (`legTurns`-тай зэрэгцээ) */
  legTurnDarts: number[][];
  /** Хожсон leg-ийн тоо */
  legsWon: number;
}

export interface GameState {
  /** Тоглоомын давтагдашгүй id (түүхэнд давхардуулахгүй хадгалахад) */
  id: string;
  phase: GamePhase;
  startingScore: StartingScore;
  /** Хосоор (double) хаах дүрэм идэвхтэй эсэх */
  doubleOut: boolean;
  /** Хэдэн leg хожвол тоглоомыг бүрэн хожих вэ (эхэлж хүрсэн нь ялна) */
  legsToWin: number;
  /** Одоогийн leg-ийн дугаар (1-ээс эхэлнэ) */
  legNumber: number;
  players: Player[];
  /** Одоо ээлжтэй тоглогчийн index */
  currentPlayerIndex: number;
  /** Энэ leg-ийг эхэлсэн тоглогчийн index (leg бүрд ээлжлэн солигдоно) */
  legStarterIndex: number;
  /** Тоглоомыг бүрэн ялсан тоглогчийн id (finished үед) */
  winnerId: string | null;
  /** Хамгийн сүүлд хаасан leg-ийн ялагчийн id (leg хооронд харуулахад) */
  legWinnerId: string | null;
  /** Хамгийн сүүлийн ээлж bust байсан эсэх (UI дээр түр харуулна) */
  lastWasBust: boolean;
}

/** Сумны үржүүлэгч: 1 = single, 2 = double, 3 = treble */
export type Multiplier = 1 | 2 | 3;

/** Нэг сум. `segment`: 0 = алдсан, 1–20, 25 = bull (D25 = bullseye 50) */
export interface Dart {
  segment: number;
  multiplier: Multiplier;
}

/** Оноо оруулах горим: ээлжийн нийт оноо эсвэл сум тус бүр */
export type InputMode = "total" | "darts";
