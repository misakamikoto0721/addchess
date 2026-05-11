import type { BoardState, GameSnapshot, GameStatus, Side } from "../model/types.js";
import { inCheck } from "./attacks.js";
import { legalMoves } from "./legalMoves.js";

function squareColor(sq: { file: number; rank: number }): boolean {
  return (sq.file + sq.rank) % 2 === 0;
}

function parseKey(key: string): { file: number; rank: number } {
  const [f, r] = key.split(",").map(Number);
  return { file: f!, rank: r! };
}

/** Conservative dead-position draw (common automatic cases). */
export function isInsufficientMaterial(board: BoardState): boolean {
  const entries = [...board.entries()].filter(([, p]) => p.kind !== "king");
  if (entries.length === 0) return true;
  if (
    entries.some(
      ([, p]) =>
        p.kind === "pawn" || p.kind === "rook" || p.kind === "queen",
    )
  ) {
    return false;
  }

  if (entries.length === 1) return true;

  if (entries.length === 2) {
    const [ka, a] = entries[0]!;
    const [, b] = entries[1]!;
    if (a.kind === "knight" && b.kind === "knight") return true;
    if (a.kind === "bishop" && b.kind === "bishop" && a.side !== b.side) {
      return (
        squareColor(parseKey(ka)) === squareColor(parseKey(entries[1]![0]))
      );
    }
  }

  return false;
}

export function getGameStatus(snapshot: GameSnapshot): GameStatus {
  const moves = legalMoves(snapshot);
  const checked = inCheck(snapshot.board, snapshot.sideToMove);

  if (moves.length === 0) {
    if (checked) {
      const winner: Side = snapshot.sideToMove === "white" ? "black" : "white";
      return { kind: "checkmate", winner };
    }
    return { kind: "stalemate" };
  }

  if (snapshot.meta.halfmoveClock >= 100) {
    return { kind: "draw", reason: "fifty-move" };
  }

  if (isInsufficientMaterial(snapshot.board)) {
    return { kind: "draw", reason: "insufficient-material" };
  }

  return { kind: "playing", inCheck: checked };
}
