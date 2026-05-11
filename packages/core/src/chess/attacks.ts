import { pieceAt } from "../model/Board.js";
import type { BoardState, Side, Square } from "../model/types.js";
import {
  BISHOP_DIRS,
  KNIGHT_DELTAS,
  KING_DELTAS,
  ROOK_DIRS,
  onBoard,
} from "./coords.js";

function slidingAttackAlongRay(
  board: BoardState,
  target: Square,
  dir: Square,
  attackerSide: Side,
  orthogonal: boolean,
): boolean {
  let f = target.file + dir.file;
  let r = target.rank + dir.rank;
  while (onBoard({ file: f, rank: r })) {
    const p = pieceAt(board, { file: f, rank: r });
    if (!p) {
      f += dir.file;
      r += dir.rank;
      continue;
    }
    if (p.side !== attackerSide) return false;
    return orthogonal
      ? p.kind === "rook" || p.kind === "queen"
      : p.kind === "bishop" || p.kind === "queen";
  }
  return false;
}

/** True if `bySide` attacks square `target` (used for check / castling). */
export function isSquareAttacked(
  board: BoardState,
  target: Square,
  bySide: Side,
): boolean {
  // Pawns
  if (bySide === "white") {
    const sw: Square = { file: target.file - 1, rank: target.rank + 1 };
    const se: Square = { file: target.file + 1, rank: target.rank + 1 };
    for (const s of [sw, se]) {
      if (!onBoard(s)) continue;
      const p = pieceAt(board, s);
      if (p?.side === "white" && p.kind === "pawn") return true;
    }
  } else {
    const nw: Square = { file: target.file - 1, rank: target.rank - 1 };
    const ne: Square = { file: target.file + 1, rank: target.rank - 1 };
    for (const s of [nw, ne]) {
      if (!onBoard(s)) continue;
      const p = pieceAt(board, s);
      if (p?.side === "black" && p.kind === "pawn") return true;
    }
  }

  // Knights
  for (const d of KNIGHT_DELTAS) {
    const s: Square = { file: target.file + d.file, rank: target.rank + d.rank };
    if (!onBoard(s)) continue;
    const p = pieceAt(board, s);
    if (p?.side === bySide && p.kind === "knight") return true;
  }

  // King (adjacent — avoids false positives in castling / king distance)
  for (const d of KING_DELTAS) {
    const s: Square = { file: target.file + d.file, rank: target.rank + d.rank };
    if (!onBoard(s)) continue;
    const p = pieceAt(board, s);
    if (p?.side === bySide && p.kind === "king") return true;
  }

  for (const dir of ROOK_DIRS) {
    if (slidingAttackAlongRay(board, target, dir, bySide, true)) return true;
  }
  for (const dir of BISHOP_DIRS) {
    if (slidingAttackAlongRay(board, target, dir, bySide, false)) return true;
  }

  return false;
}

export function findKing(board: BoardState, side: Side): Square | undefined {
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const p = pieceAt(board, { file, rank });
      if (p?.kind === "king" && p.side === side) return { file, rank };
    }
  }
  return undefined;
}

export function inCheck(board: BoardState, side: Side): boolean {
  const k = findKing(board, side);
  if (!k) return false;
  const by: Side = side === "white" ? "black" : "white";
  return isSquareAttacked(board, k, by);
}
