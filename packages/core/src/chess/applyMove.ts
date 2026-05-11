import { cloneBoard, pieceAt, squareKey } from "../model/Board.js";
import type {
  CastlingRights,
  ChessMeta,
  GameSnapshot,
  Move,
  Piece,
  Side,
  Square,
} from "../model/types.js";

function stripCastlingAfterMove(
  castling: CastlingRights,
  moving: Piece,
  from: Square,
  to: Square,
  captured: Piece | undefined,
): CastlingRights {
  const c = { ...castling };

  if (moving.kind === "king") {
    if (moving.side === "white") {
      c.whiteKingSide = false;
      c.whiteQueenSide = false;
    } else {
      c.blackKingSide = false;
      c.blackQueenSide = false;
    }
  }

  if (moving.kind === "rook") {
    if (moving.side === "white") {
      if (from.file === 0 && from.rank === 7) c.whiteQueenSide = false;
      if (from.file === 7 && from.rank === 7) c.whiteKingSide = false;
    } else {
      if (from.file === 0 && from.rank === 0) c.blackQueenSide = false;
      if (from.file === 7 && from.rank === 0) c.blackKingSide = false;
    }
  }

  if (captured?.kind === "rook") {
    if (to.file === 0 && to.rank === 7) c.whiteQueenSide = false;
    if (to.file === 7 && to.rank === 7) c.whiteKingSide = false;
    if (to.file === 0 && to.rank === 0) c.blackQueenSide = false;
    if (to.file === 7 && to.rank === 0) c.blackKingSide = false;
  }

  return c;
}

function epVictimSquare(move: Move, side: Side): Square {
  const rank = side === "white" ? move.to.rank + 1 : move.to.rank - 1;
  return { file: move.to.file, rank };
}

/** Applies one move; returns snapshot unchanged if illegal shape (wrong side / missing promotion). */
export function applyMove(snapshot: GameSnapshot, move: Move): GameSnapshot {
  const board = cloneBoard(snapshot.board);
  const moving = pieceAt(board, move.from);
  if (!moving || moving.side !== snapshot.sideToMove) return snapshot;

  const promoRank = moving.side === "white" ? 0 : 7;
  if (
    moving.kind === "pawn" &&
    move.to.rank === promoRank &&
    (!move.promotion || move.promotion === "king" || move.promotion === "pawn")
  ) {
    return snapshot;
  }

  const capturedAtDest = pieceAt(board, move.to);
  const isEp =
    moving.kind === "pawn" &&
    move.from.file !== move.to.file &&
    !capturedAtDest;

  const capturedForRights =
    capturedAtDest ??
    (isEp
      ? pieceAt(board, epVictimSquare(move, moving.side))
      : undefined);

  let castling = stripCastlingAfterMove(
    snapshot.meta.castling,
    moving,
    move.from,
    move.to,
    capturedForRights,
  );

  let enPassantTarget: Square | null = null;

  const isCastle =
    moving.kind === "king" &&
    Math.abs(move.to.file - move.from.file) === 2;

  if (isCastle) {
    const r = move.from.rank;
    const kingSide = move.to.file === 6;
    const rookFrom: Square = { file: kingSide ? 7 : 0, rank: r };
    const rookTo: Square = { file: kingSide ? 5 : 3, rank: r };
    const rook = pieceAt(board, rookFrom);
    board.delete(squareKey(move.from));
    board.delete(squareKey(rookFrom));
    board.set(squareKey(move.to), moving);
    if (rook) board.set(squareKey(rookTo), rook);
  } else {
    board.delete(squareKey(move.from));
    if (isEp) {
      board.delete(squareKey(epVictimSquare(move, moving.side)));
    }
    let placed: Piece = moving;
    if (moving.kind === "pawn" && move.to.rank === promoRank && move.promotion) {
      placed = { kind: move.promotion, side: moving.side };
    }
    board.set(squareKey(move.to), placed);

    if (
      moving.kind === "pawn" &&
      Math.abs(move.to.rank - move.from.rank) === 2
    ) {
      enPassantTarget = {
        file: move.from.file,
        rank: (move.from.rank + move.to.rank) >> 1,
      };
    }
  }

  let half = snapshot.meta.halfmoveClock;
  if (moving.kind === "pawn" || capturedAtDest || isEp) half = 0;
  else half += 1;

  let full = snapshot.meta.fullmoveNumber;
  if (snapshot.sideToMove === "black") full += 1;

  const meta: ChessMeta = {
    castling,
    enPassantTarget,
    halfmoveClock: half,
    fullmoveNumber: full,
  };

  const nextSide: Side =
    snapshot.sideToMove === "white" ? "black" : "white";

  return {
    board,
    sideToMove: nextSide,
    meta,
  };
}
