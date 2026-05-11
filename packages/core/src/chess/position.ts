import { emptyBoard, squareKey } from "../model/Board.js";
import type {
  BoardState,
  ChessMeta,
  GameSnapshot,
  Piece,
  Side,
} from "../model/types.js";

function put(
  board: BoardState,
  file: number,
  rank: number,
  kind: Piece["kind"],
  side: Side,
): void {
  board.set(squareKey({ file, rank }), { kind, side });
}

export function defaultChessMeta(): ChessMeta {
  return {
    castling: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

/** Standard starting position; White to move. */
export function createStandardGame(): GameSnapshot {
  const board = emptyBoard();

  for (let f = 0; f < 8; f++) {
    put(board, f, 6, "pawn", "white");
    put(board, f, 1, "pawn", "black");
  }

  put(board, 0, 7, "rook", "white");
  put(board, 7, 7, "rook", "white");
  put(board, 0, 0, "rook", "black");
  put(board, 7, 0, "rook", "black");

  put(board, 1, 7, "knight", "white");
  put(board, 6, 7, "knight", "white");
  put(board, 1, 0, "knight", "black");
  put(board, 6, 0, "knight", "black");

  put(board, 2, 7, "bishop", "white");
  put(board, 5, 7, "bishop", "white");
  put(board, 2, 0, "bishop", "black");
  put(board, 5, 0, "bishop", "black");

  put(board, 3, 7, "queen", "white");
  put(board, 3, 0, "queen", "black");

  put(board, 4, 7, "king", "white");
  put(board, 4, 0, "king", "black");

  return {
    board,
    sideToMove: "white",
    meta: defaultChessMeta(),
  };
}
