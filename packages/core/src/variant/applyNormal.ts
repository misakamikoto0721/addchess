import { applyMove } from "../chess/applyMove.js";
import { inCheck } from "../chess/attacks.js";
import { pieceAt, squareKey, cloneBoard } from "../model/Board.js";
import type { Move } from "../model/types.js";
import { computeLianjiangAfterWhite } from "./lianjiang.js";
import { pieceIdsAfterNormalMove } from "./transferIds.js";
import { toGameSnapshot } from "./snapshot.js";
import type { VariantSnapshot } from "./types.js";

export function applyNormalMove(
  v: VariantSnapshot,
  move: Move,
): VariantSnapshot | null {
  if (v.phase !== "play") return null;
  const base = toGameSnapshot(v);
  const moving = pieceAt(base.board, move.from);
  if (!moving || moving.side !== base.sideToMove) return null;

  const next = applyMove(base, move);
  if (next === base) return null;

  const ids = pieceIdsAfterNormalMove(v, move);
  if (!ids) return null;

  const lj =
    v.sideToMove === "white"
      ? computeLianjiangAfterWhite(v, next.board, ids)
      : {
          lianjiangSequence: v.lianjiangSequence,
          whiteCheckUsedIds: v.whiteCheckUsedIds,
        };

  return {
    ...v,
    board: next.board,
    meta: next.meta,
    sideToMove: next.sideToMove,
    pieceIds: ids,
    ...lj,
  };
}

/** Board after placing black king during setup (no meta change). */
export function blackKingSetupHighlights(v: VariantSnapshot): {
  legal: { file: number; rank: number }[];
  blocked: { file: number; rank: number }[];
} {
  if (v.phase !== "place_black_king") return { legal: [], blocked: [] };
  const legal: { file: number; rank: number }[] = [];
  const blocked: { file: number; rank: number }[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const to = { file, rank };
      if (pieceAt(v.board, to)) continue;
      if (applyPlaceBlackKing(v, to)) legal.push(to);
      else blocked.push(to);
    }
  }
  return { legal, blocked };
}

export function applyPlaceBlackKing(
  v: VariantSnapshot,
  to: { file: number; rank: number },
): VariantSnapshot | null {
  if (v.phase !== "place_black_king") return null;
  if (pieceAt(v.board, to)) return null;

  const board = cloneBoard(v.board);
  const ids = new Map(v.pieceIds);
  const k = squareKey(to);
  board.set(k, { kind: "king", side: "black" });
  if (inCheck(board, "black")) return null;

  ids.set(k, `b${v.nextPieceId}`);

  return {
    ...v,
    board,
    pieceIds: ids,
    nextPieceId: v.nextPieceId + 1,
    phase: "play",
    sideToMove: "white",
  };
}
