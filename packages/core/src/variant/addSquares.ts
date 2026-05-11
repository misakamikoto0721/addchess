import { pieceAt, squareKey } from "../model/Board.js";
import type { PieceKind, Square } from "../model/types.js";
import { applyBlackAdd } from "./addPiece.js";
import type { VariantSnapshot } from "./types.js";

const PROMO: PieceKind[] = ["queen", "rook", "bishop", "knight"];

/** Empty squares where this add can succeed (promotion-flexible for last-rank pawn). */
export function legalBlackAddDestinations(
  v: VariantSnapshot,
  kind: PieceKind,
): Square[] {
  const out: Square[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const to: Square = { file, rank };
      if (kind === "pawn" && rank === 7) {
        if (PROMO.some((p) => applyBlackAdd(v, kind, to, p) !== null)) {
          out.push(to);
        }
      } else if (applyBlackAdd(v, kind, to) !== null) {
        out.push(to);
      }
    }
  }
  return out;
}

export function blackAddHighlights(
  v: VariantSnapshot,
  kind: PieceKind,
): { legal: Square[]; blocked: Square[] } {
  const legalSq = legalBlackAddDestinations(v, kind);
  const set = new Set(legalSq.map((s) => squareKey(s)));
  const blocked: Square[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const sq: Square = { file, rank };
      if (pieceAt(v.board, sq)) continue;
      if (!set.has(squareKey(sq))) blocked.push(sq);
    }
  }
  return { legal: legalSq, blocked };
}
