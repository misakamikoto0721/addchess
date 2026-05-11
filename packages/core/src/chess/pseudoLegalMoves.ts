import { pieceAt } from "../model/Board.js";
import type {
  BoardState,
  GameSnapshot,
  Move,
  Piece,
  PieceKind,
  Side,
  Square,
} from "../model/types.js";
import { isSquareAttacked } from "./attacks.js";
import {
  BISHOP_DIRS,
  KNIGHT_DELTAS,
  KING_DELTAS,
  ROOK_DIRS,
  onBoard,
} from "./coords.js";

const PROMOTIONS: PieceKind[] = ["queen", "rook", "bishop", "knight"];

function pushPawnMoves(
  board: BoardState,
  from: Square,
  side: Side,
  ep: Square | null,
  out: Move[],
): void {
  const dir = side === "white" ? -1 : 1;
  const startRank = side === "white" ? 6 : 1;
  const promoRank = side === "white" ? 0 : 7;

  const one: Square = { file: from.file, rank: from.rank + dir };
  if (onBoard(one) && !pieceAt(board, one)) {
    if (one.rank === promoRank) {
      for (const pr of PROMOTIONS) {
        out.push({ from, to: one, promotion: pr });
      }
    } else {
      out.push({ from, to: one });
      if (from.rank === startRank) {
        const two: Square = { file: from.file, rank: from.rank + 2 * dir };
        if (onBoard(two) && !pieceAt(board, two)) {
          out.push({ from, to: two });
        }
      }
    }
  }

  for (const df of [-1, 1]) {
    const cap: Square = { file: from.file + df, rank: from.rank + dir };
    if (!onBoard(cap)) continue;
    const target = pieceAt(board, cap);
    if (target && target.side !== side) {
      if (cap.rank === promoRank) {
        for (const pr of PROMOTIONS) {
          out.push({ from, to: cap, promotion: pr });
        }
      } else {
        out.push({ from, to: cap });
      }
    } else if (ep && cap.file === ep.file && cap.rank === ep.rank && !target) {
      const victimRank = side === "white" ? ep.rank + 1 : ep.rank - 1;
      const victim = pieceAt(board, { file: ep.file, rank: victimRank });
      if (victim?.kind === "pawn" && victim.side !== side) {
        out.push({ from, to: cap });
      }
    }
  }
}

function pushKnightMoves(
  board: BoardState,
  from: Square,
  side: Side,
  out: Move[],
): void {
  for (const d of KNIGHT_DELTAS) {
    const to: Square = { file: from.file + d.file, rank: from.rank + d.rank };
    if (!onBoard(to)) continue;
    const o = pieceAt(board, to);
    if (!o || o.side !== side) out.push({ from, to });
  }
}

function pushKingMoves(
  board: BoardState,
  from: Square,
  side: Side,
  out: Move[],
): void {
  for (const d of KING_DELTAS) {
    const to: Square = { file: from.file + d.file, rank: from.rank + d.rank };
    if (!onBoard(to)) continue;
    const o = pieceAt(board, to);
    if (!o || o.side !== side) out.push({ from, to });
  }
}

function pushSliding(
  board: BoardState,
  from: Square,
  side: Side,
  dirs: readonly Square[],
  out: Move[],
): void {
  for (const dir of dirs) {
    let f = from.file + dir.file;
    let r = from.rank + dir.rank;
    while (onBoard({ file: f, rank: r })) {
      const to: Square = { file: f, rank: r };
      const o = pieceAt(board, to);
      if (!o) {
        out.push({ from, to });
      } else {
        if (o.side !== side) out.push({ from, to });
        break;
      }
      f += dir.file;
      r += dir.rank;
    }
  }
}

function pushCastling(
  snapshot: GameSnapshot,
  board: BoardState,
  kingFrom: Square,
  side: Side,
  out: Move[],
): void {
  const rank = side === "white" ? 7 : 0;
  if (kingFrom.file !== 4 || kingFrom.rank !== rank) return;

  const opp: Side = side === "white" ? "black" : "white";

  if (side === "white") {
    if (snapshot.meta.castling.whiteKingSide) {
      const path = [
        { file: 5, rank },
        { file: 6, rank },
      ];
      if (
        !pieceAt(board, path[0]!) &&
        !pieceAt(board, path[1]!) &&
        pieceAt(board, { file: 7, rank })?.kind === "rook" &&
        pieceAt(board, { file: 7, rank })?.side === "white" &&
        !isSquareAttacked(board, kingFrom, opp) &&
        !isSquareAttacked(board, path[0]!, opp) &&
        !isSquareAttacked(board, path[1]!, opp)
      ) {
        out.push({ from: kingFrom, to: { file: 6, rank } });
      }
    }
    if (snapshot.meta.castling.whiteQueenSide) {
      const empties = [
        { file: 3, rank },
        { file: 2, rank },
        { file: 1, rank },
      ];
      if (
        !pieceAt(board, empties[0]!) &&
        !pieceAt(board, empties[1]!) &&
        !pieceAt(board, empties[2]!) &&
        pieceAt(board, { file: 0, rank })?.kind === "rook" &&
        pieceAt(board, { file: 0, rank })?.side === "white" &&
        !isSquareAttacked(board, kingFrom, opp) &&
        !isSquareAttacked(board, empties[0]!, opp) &&
        !isSquareAttacked(board, empties[1]!, opp)
      ) {
        out.push({ from: kingFrom, to: { file: 2, rank } });
      }
    }
  } else {
    if (snapshot.meta.castling.blackKingSide) {
      const path = [
        { file: 5, rank },
        { file: 6, rank },
      ];
      if (
        !pieceAt(board, path[0]!) &&
        !pieceAt(board, path[1]!) &&
        pieceAt(board, { file: 7, rank })?.kind === "rook" &&
        pieceAt(board, { file: 7, rank })?.side === "black" &&
        !isSquareAttacked(board, kingFrom, opp) &&
        !isSquareAttacked(board, path[0]!, opp) &&
        !isSquareAttacked(board, path[1]!, opp)
      ) {
        out.push({ from: kingFrom, to: { file: 6, rank } });
      }
    }
    if (snapshot.meta.castling.blackQueenSide) {
      const empties = [
        { file: 3, rank },
        { file: 2, rank },
        { file: 1, rank },
      ];
      if (
        !pieceAt(board, empties[0]!) &&
        !pieceAt(board, empties[1]!) &&
        !pieceAt(board, empties[2]!) &&
        pieceAt(board, { file: 0, rank })?.kind === "rook" &&
        pieceAt(board, { file: 0, rank })?.side === "black" &&
        !isSquareAttacked(board, kingFrom, opp) &&
        !isSquareAttacked(board, empties[0]!, opp) &&
        !isSquareAttacked(board, empties[1]!, opp)
      ) {
        out.push({ from: kingFrom, to: { file: 2, rank } });
      }
    }
  }
}

function movesForPiece(
  snapshot: GameSnapshot,
  board: BoardState,
  from: Square,
  piece: Piece,
  out: Move[],
): void {
  switch (piece.kind) {
    case "pawn":
      pushPawnMoves(board, from, piece.side, snapshot.meta.enPassantTarget, out);
      break;
    case "knight":
      pushKnightMoves(board, from, piece.side, out);
      break;
    case "bishop":
      pushSliding(board, from, piece.side, BISHOP_DIRS, out);
      break;
    case "rook":
      pushSliding(board, from, piece.side, ROOK_DIRS, out);
      break;
    case "queen":
      pushSliding(board, from, piece.side, [...ROOK_DIRS, ...BISHOP_DIRS], out);
      break;
    case "king":
      pushKingMoves(board, from, piece.side, out);
      pushCastling(snapshot, board, from, piece.side, out);
      break;
    default:
      break;
  }
}

export function generatePseudoLegalMoves(snapshot: GameSnapshot): Move[] {
  const board = snapshot.board;
  const side = snapshot.sideToMove;
  const out: Move[] = [];
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const from: Square = { file, rank };
      const p = pieceAt(board, from);
      if (!p || p.side !== side) continue;
      movesForPiece(snapshot, board, from, p, out);
    }
  }
  return out;
}
