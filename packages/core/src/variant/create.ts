import { emptyBoard, squareKey } from "../model/Board.js";
import type { Piece, Side } from "../model/types.js";
import { defaultChessMeta } from "../chess/position.js";
import { fullBlackReserve } from "./reserve.js";
import type { VariantSnapshot } from "./types.js";

function put(
  board: Map<string, Piece>,
  file: number,
  rank: number,
  kind: Piece["kind"],
  side: Side,
): void {
  board.set(squareKey({ file, rank }), { kind, side });
}

/** White standard layout only; Black king placement pending. */
export function createVariantInitial(): VariantSnapshot {
  const board = emptyBoard();
  const pieceIds = new Map<string, string>();
  let id = 1;
  const tag = (file: number, rank: number) => {
    pieceIds.set(squareKey({ file, rank }), `w${id++}`);
  };

  for (let f = 0; f < 8; f++) {
    put(board, f, 6, "pawn", "white");
    tag(f, 6);
  }

  put(board, 0, 7, "rook", "white");
  tag(0, 7);
  put(board, 7, 7, "rook", "white");
  tag(7, 7);

  put(board, 1, 7, "knight", "white");
  tag(1, 7);
  put(board, 6, 7, "knight", "white");
  tag(6, 7);

  put(board, 2, 7, "bishop", "white");
  tag(2, 7);
  put(board, 5, 7, "bishop", "white");
  tag(5, 7);

  put(board, 3, 7, "queen", "white");
  tag(3, 7);

  put(board, 4, 7, "king", "white");
  tag(4, 7);

  const meta = defaultChessMeta();
  meta.castling.blackKingSide = false;
  meta.castling.blackQueenSide = false;

  return {
    board,
    meta,
    sideToMove: "black",
    phase: "place_black_king",
    pieceIds,
    nextPieceId: id,
    reserve: fullBlackReserve(),
    whiteAddStreak: { pawn: 0, light: 0, heavy: 0 },
    blackTeleportUsed: false,
    lianjiangSequence: false,
    whiteCheckUsedIds: [],
  };
}
