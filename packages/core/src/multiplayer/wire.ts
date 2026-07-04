import type { Piece, PieceKind } from "../model/types.js";
import type { VariantSnapshot } from "../variant/types.js";
import type { RoomSync, Seat } from "./protocol.js";

/** JSON 可序列化的局面（Map → 键值对数组） */
export type WireVariantSnapshot = {
  board: [string, Piece][];
  meta: VariantSnapshot["meta"];
  sideToMove: VariantSnapshot["sideToMove"];
  phase: VariantSnapshot["phase"];
  pieceIds: [string, string][];
  nextPieceId: number;
  reserve: VariantSnapshot["reserve"];
  whiteAddStreak: VariantSnapshot["whiteAddStreak"];
  blackTeleportUsed: boolean;
  lianjiangSequence: boolean;
  whiteCheckUsedIds: string[];
};

export function variantToWire(v: VariantSnapshot): WireVariantSnapshot {
  return {
    board: [...v.board.entries()],
    meta: {
      ...v.meta,
      castling: { ...v.meta.castling },
      enPassantTarget: v.meta.enPassantTarget
        ? { ...v.meta.enPassantTarget }
        : null,
    },
    sideToMove: v.sideToMove,
    phase: v.phase,
    pieceIds: [...v.pieceIds.entries()],
    nextPieceId: v.nextPieceId,
    reserve: { ...v.reserve },
    whiteAddStreak: { ...v.whiteAddStreak },
    blackTeleportUsed: v.blackTeleportUsed,
    lianjiangSequence: v.lianjiangSequence,
    whiteCheckUsedIds: [...v.whiteCheckUsedIds],
  };
}

export function variantFromWire(w: WireVariantSnapshot): VariantSnapshot {
  return {
    board: new Map(w.board),
    meta: {
      ...w.meta,
      castling: { ...w.meta.castling },
      enPassantTarget: w.meta.enPassantTarget
        ? { ...w.meta.enPassantTarget }
        : null,
    },
    sideToMove: w.sideToMove,
    phase: w.phase,
    pieceIds: new Map(w.pieceIds),
    nextPieceId: w.nextPieceId,
    reserve: { ...w.reserve },
    whiteAddStreak: { ...w.whiteAddStreak },
    blackTeleportUsed: w.blackTeleportUsed,
    lianjiangSequence: w.lianjiangSequence,
    whiteCheckUsedIds: [...w.whiteCheckUsedIds],
  };
}

export function syncFromVariant(
  v: VariantSnapshot,
  awaitingWhitePickKind: boolean,
  pendingAddKind: PieceKind | null,
  pendingUndoFrom: Seat | null = null,
): RoomSync {
  return {
    variant: variantToWire(v),
    awaitingWhitePickKind,
    pendingAddKind,
    pendingUndoFrom,
  };
}
