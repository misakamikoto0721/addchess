import type { GameSnapshot, Move } from "../model/types.js";
import { applyMove } from "./applyMove.js";
import { inCheck } from "./attacks.js";
import { generatePseudoLegalMoves } from "./pseudoLegalMoves.js";

export function legalMoves(snapshot: GameSnapshot): Move[] {
  const pseudo = generatePseudoLegalMoves(snapshot);
  const side = snapshot.sideToMove;
  const legal: Move[] = [];
  for (const m of pseudo) {
    const next = applyMove(snapshot, m);
    if (next === snapshot) continue;
    if (!inCheck(next.board, side)) legal.push(m);
  }
  return legal;
}
