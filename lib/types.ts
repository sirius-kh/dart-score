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
  /** Идэвхтэй leg-д хаясан нийт сум (bust ээлжийг оруулна) */
  dartsThrown: number;
  /** Дууссан leg бүрийн ээлжүүд (бүх тоглоомын статистикт) */
  legTurns: number[][];
  /** Дууссан leg бүрд хаясан сумны тоо */
  legDarts: number[];
  /** Хожсон leg-ийн тоо */
  legsWon: number;
}

export interface GameState {
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
