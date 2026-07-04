import type { BoardState, ChessMeta, Side } from "../model/types.js";

export type VariantPhase = "place_black_king" | "play";

/** 兵 / 轻子(马象) / 重子(车后) — White picks when Black adds. */
export type AddCategory = "pawn" | "light" | "heavy";

export type BlackReserve = {
  pawn: number;
  knight: number;
  bishop: number;
  rook: number;
  queen: number;
};

export type WhiteAddStreak = {
  pawn: number;
  light: number;
  heavy: number;
};

export type VariantSnapshot = {
  board: BoardState;
  meta: ChessMeta;
  sideToMove: Side;
  phase: VariantPhase;
  pieceIds: Map<string, string>;
  nextPieceId: number;
  reserve: BlackReserve;
  whiteAddStreak: WhiteAddStreak;
  /** Once any reserve category is fully depleted (added out). */
  blackTeleportUsed: boolean;
  lianjiangSequence: boolean;
  whiteCheckUsedIds: readonly string[];
};
