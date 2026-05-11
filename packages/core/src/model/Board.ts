import type { BoardState, Piece, Square } from "./types.js";

export function squareKey(s: Square): string {
  return `${s.file},${s.rank}`;
}

export function emptyBoard(): BoardState {
  return new Map();
}

export function cloneBoard(board: BoardState): BoardState {
  return new Map(board);
}

export function pieceAt(board: BoardState, sq: Square): Piece | undefined {
  return board.get(squareKey(sq));
}
