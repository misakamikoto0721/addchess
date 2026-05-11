import { cloneBoard } from "../model/Board.js";
import type { GameSnapshot } from "../model/types.js";
import type { VariantSnapshot } from "./types.js";

export function toGameSnapshot(v: VariantSnapshot): GameSnapshot {
  return {
    board: v.board,
    sideToMove: v.sideToMove,
    meta: v.meta,
  };
}

export function cloneVariant(v: VariantSnapshot): VariantSnapshot {
  return {
    ...v,
    board: cloneBoard(v.board),
    meta: {
      ...v.meta,
      castling: { ...v.meta.castling },
    },
    pieceIds: new Map(v.pieceIds),
    reserve: { ...v.reserve },
    whiteAddStreak: { ...v.whiteAddStreak },
    whiteCheckUsedIds: [...v.whiteCheckUsedIds],
  };
}
