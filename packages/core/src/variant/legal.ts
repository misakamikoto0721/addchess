import { applyMove } from "../chess/applyMove.js";
import { findKing, inCheck } from "../chess/attacks.js";
import { legalMoves as chessLegalMoves } from "../chess/legalMoves.js";
import { generatePseudoLegalMoves } from "../chess/pseudoLegalMoves.js";
import { squaresAttacking } from "../chess/pieceAttacks.js";
import { pieceAt, squareKey } from "../model/Board.js";
import type { Move, Square } from "../model/types.js";
import { whiteLegalPieceKinds } from "./addPiece.js";
import { pieceIdsAfterNormalMove } from "./transferIds.js";
import {
  canBlackTeleport,
  legalTeleportSquares,
} from "./teleport.js";
import { threeCategoriesInReserve } from "./reserve.js";
import { toGameSnapshot } from "./snapshot.js";
import type { VariantSnapshot } from "./types.js";

export function legalWhiteMoves(v: VariantSnapshot): Move[] {
  if (v.phase !== "play" || v.sideToMove !== "white") return [];
  const base = toGameSnapshot(v);
  const pseudo = generatePseudoLegalMoves(base);
  const limThree = threeCategoriesInReserve(v.reserve);

  const legal: Move[] = [];
  for (const m of pseudo) {
    const next = applyMove(base, m);
    if (next === base) continue;
    if (inCheck(next.board, "white")) continue;

    const nextIds = pieceIdsAfterNormalMove(v, m);
    if (!nextIds) continue;

    const blackChecked = inCheck(next.board, "black");
    if (blackChecked && limThree) {
      const kingSq = findKing(next.board, "black");
      if (!kingSq) continue;
      const attackers = squaresAttacking(next.board, kingSq, "white");
      const atkIds = attackers
        .map((sq) => nextIds.get(squareKey(sq)))
        .filter((x): x is string => Boolean(x));
      if (atkIds.some((id) => v.whiteCheckUsedIds.includes(id))) continue;
    }

    legal.push(m);
  }
  return legal;
}

export function legalBlackBoardMoves(v: VariantSnapshot): Move[] {
  if (v.phase !== "play" || v.sideToMove !== "black") return [];
  return chessLegalMoves(toGameSnapshot(v));
}

export function blackHasLegalAdd(v: VariantSnapshot): boolean {
  if (v.phase !== "play" || v.sideToMove !== "black") return false;
  if (inCheck(v.board, "black")) return false;
  if (whiteLegalPieceKinds(v).length === 0) return false;
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      if (!pieceAt(v.board, { file, rank })) return true;
    }
  }
  return false;
}

export function blackHasLegalTeleport(v: VariantSnapshot): boolean {
  return legalTeleportSquares(v).length > 0;
}

/** Any legal black turn action exists (move / add / teleport). */
export function blackHasAnyLegalAction(v: VariantSnapshot): boolean {
  if (v.phase !== "play" || v.sideToMove !== "black") return false;
  if (legalBlackBoardMoves(v).length > 0) return true;
  if (blackHasLegalAdd(v)) return true;
  if (canBlackTeleport(v) && blackHasLegalTeleport(v)) return true;
  return false;
}

export function pseudoMovesFrom(
  v: VariantSnapshot,
  from: Square,
): Move[] {
  const base = toGameSnapshot(v);
  return generatePseudoLegalMoves(base).filter(
    (m) => m.from.file === from.file && m.from.rank === from.rank,
  );
}

export function whiteHighlightSquares(
  v: VariantSnapshot,
  from: Square,
): { legal: Square[]; blocked: Square[] } {
  if (v.phase !== "play" || v.sideToMove !== "white") {
    return { legal: [], blocked: [] };
  }
  const moving = pieceAt(v.board, from);
  if (!moving || moving.side !== "white") {
    return { legal: [], blocked: [] };
  }

  const pseudo = pseudoMovesFrom(v, from);
  const lm = legalWhiteMoves(v).filter(
    (m) => m.from.file === from.file && m.from.rank === from.rank,
  );

  const legalKeys = new Set(
    lm.map((m) => `${m.to.file},${m.to.rank}|${m.promotion ?? ""}`),
  );

  const byDest = new Map<string, Move[]>();
  for (const m of pseudo) {
    const k = `${m.to.file},${m.to.rank}`;
    const arr = byDest.get(k) ?? [];
    arr.push(m);
    byDest.set(k, arr);
  }

  const legalSq: Square[] = [];
  const blockedSq: Square[] = [];

  for (const [destKey, moves] of byDest) {
    const [fa, ra] = destKey.split(",").map(Number) as [number, number];
    const dest: Square = { file: fa!, rank: ra! };
    const anyOk = moves.some((m) =>
      legalKeys.has(`${m.to.file},${m.to.rank}|${m.promotion ?? ""}`),
    );
    if (anyOk) legalSq.push(dest);
    else blockedSq.push(dest);
  }

  return { legal: legalSq, blocked: blockedSq };
}

export function blackHighlightSquares(
  v: VariantSnapshot,
  from: Square,
): { legal: Square[]; blocked: Square[] } {
  if (v.phase !== "play" || v.sideToMove !== "black") {
    return { legal: [], blocked: [] };
  }
  const moving = pieceAt(v.board, from);
  if (!moving || moving.side !== "black") {
    return { legal: [], blocked: [] };
  }

  const pseudo = pseudoMovesFrom(v, from);
  const lm = legalBlackBoardMoves(v).filter(
    (m) => m.from.file === from.file && m.from.rank === from.rank,
  );

  const legalKeys = new Set(
    lm.map((m) => `${m.to.file},${m.to.rank}|${m.promotion ?? ""}`),
  );

  const byDest = new Map<string, Move[]>();
  for (const m of pseudo) {
    const k = `${m.to.file},${m.to.rank}`;
    const arr = byDest.get(k) ?? [];
    arr.push(m);
    byDest.set(k, arr);
  }

  const legalSq: Square[] = [];
  const blockedSq: Square[] = [];

  for (const [destKey, moves] of byDest) {
    const [fa, ra] = destKey.split(",").map(Number) as [number, number];
    const dest: Square = { file: fa!, rank: ra! };
    const anyOk = moves.some((m) =>
      legalKeys.has(`${m.to.file},${m.to.rank}|${m.promotion ?? ""}`),
    );
    if (anyOk) legalSq.push(dest);
    else blockedSq.push(dest);
  }

  return { legal: legalSq, blocked: blockedSq };
}
