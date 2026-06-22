// Дартсын X01 тоглоомын төрлүүд

export type StartingScore = 301 | 501 | 701;

export type GamePhase = "setup" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  /** Үлдсэн оноо (тэг рүү буурна) */
  remaining: number;
  /** Бүртгэгдсэн ээлж бүрийн нийт оноо (bust-ийг оруулахгүй) */
  turns: number[];
}

export interface GameState {
  phase: GamePhase;
  startingScore: StartingScore;
  players: Player[];
  /** Одоо ээлжтэй тоглогчийн index */
  currentPlayerIndex: number;
  /** Ялсан тоглогчийн id (finished үед) */
  winnerId: string | null;
}
