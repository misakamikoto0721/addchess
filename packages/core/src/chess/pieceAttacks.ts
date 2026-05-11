import { pieceAt, squareKey } from "../model/Board.js";
import type { BoardState, Piece, Side, Square } from "../model/types.js";
import {
  BISHOP_DIRS,
  KNIGHT_DELTAS,
  ROOK_DIRS,
  onBoard,
} from "./coords.js";

/** Geometric attack (ignore pin); used for listing checkers after a move. */
export function pieceAttacksSquare(
  board: BoardState,
  from: Square,
  piece: Piece,
  target: Square,
): boolean {
  if (piece.side === "black") {
    // directions inverted vs white pawn — mirror ranks for pawn logic
    if (piece.kind === "pawn") {
      const capW = target.file - from.file;
      const capR = target.rank - from.rank;
      return Math.abs(capW) === 1 && capR === 1;
    }
  } else {
    if (piece.kind === "pawn") {
      const capW = target.file - from.file;
      const capR = target.rank - from.rank;
      return Math.abs(capW) === 1 && capR === -1;
    }
  }

  if (piece.kind === "knight") {
    for (const d of KNIGHT_DELTAS) {
      const t: Square = { file: from.file + d.file, rank: from.rank + d.rank };
      if (t.file === target.file && t.rank === target.rank) return true;
    }
    return false;
  }

  if (piece.kind === "king") {
    return (
      Math.abs(target.file - from.file) <= 1 &&
      Math.abs(target.rank - from.rank) <= 1
    );
  }

  const dirs =
    piece.kind === "rook"
      ? ROOK_DIRS
      : piece.kind === "bishop"
        ? BISHOP_DIRS
        : piece.kind === "queen"
          ? [...ROOK_DIRS, ...BISHOP_DIRS]
          : [];

  for (const dir of dirs) {
    let f = from.file + dir.file;
    let r = from.rank + dir.rank;
    while (onBoard({ file: f, rank: r })) {
      if (f === target.file && r === target.rank) return true;
      if (board.has(squareKey({ file: f, rank: r }))) break;
      f += dir.file;
      r += dir.rank;
    }
  }

  return false;
}

export function squaresAttacking(
  board: BoardState,
  target: Square,
  attackerSide: Side,
): Square[] {
  const out: Square[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const from: Square = { file, rank };
      const p = pieceAt(board, from);
      if (!p || p.side !== attackerSide) continue;
      if (pieceAttacksSquare(board, from, p, target)) out.push(from);
    }
  }
  return out;
}
