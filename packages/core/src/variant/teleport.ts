import { findKing, inCheck } from "../chess/attacks.js";
import { cloneBoard, pieceAt, squareKey } from "../model/Board.js";
import type { Square } from "../model/types.js";
import { kingSquareAfterTeleport } from "./lianjiang.js";
import { teleportCategoryUnlocked } from "./reserve.js";
import type { VariantSnapshot } from "./types.js";

export function canBlackTeleport(v: VariantSnapshot): boolean {
  return (
    v.phase === "play" &&
    v.sideToMove === "black" &&
    !v.blackTeleportUsed &&
    teleportCategoryUnlocked(v.reserve)
  );
}

export function legalTeleportSquares(v: VariantSnapshot): Square[] {
  if (!canBlackTeleport(v)) return [];
  const kFrom = findKing(v.board, "black");
  if (!kFrom) return [];

  const out: Square[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const to: Square = { file, rank };
      if (pieceAt(v.board, to)) continue;
      const board = cloneBoard(v.board);
      board.delete(squareKey(kFrom));
      board.set(squareKey(to), { kind: "king", side: "black" });
      if (!inCheck(board, "black")) out.push(to);
    }
  }
  return out;
}

/** Empty squares: legal landing vs ruled out (still empty). */
export function teleportHighlights(v: VariantSnapshot): {
  legal: Square[];
  blocked: Square[];
} {
  const legalSq = legalTeleportSquares(v);
  const legalSet = new Set(legalSq.map((s) => squareKey(s)));
  const legal: Square[] = [];
  const blocked: Square[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const sq: Square = { file, rank };
      if (pieceAt(v.board, sq)) continue;
      if (legalSet.has(squareKey(sq))) legal.push(sq);
      else blocked.push(sq);
    }
  }
  return { legal, blocked };
}

export function applyBlackTeleport(
  v: VariantSnapshot,
  to: Square,
): VariantSnapshot | null {
  if (!canBlackTeleport(v)) return null;
  if (pieceAt(v.board, to)) return null;

  const kFrom = findKing(v.board, "black");
  if (!kFrom) return null;

  const board = cloneBoard(v.board);
  board.delete(squareKey(kFrom));
  board.set(squareKey(to), { kind: "king", side: "black" });
  if (inCheck(board, "black")) return null;

  const pieceIds = kingSquareAfterTeleport(v, kFrom, to);

  return {
    ...v,
    board,
    pieceIds,
    sideToMove: "white",
    blackTeleportUsed: true,
  };
}
