import { inCheck } from "../chess/attacks.js";
import type { GameStatus } from "../model/types.js";
import { isInsufficientMaterial } from "../chess/status.js";
import {
  blackHasLegalAdd,
  blackHasLegalTeleport,
  legalBlackBoardMoves,
  legalWhiteMoves,
} from "./legal.js";
import { canBlackTeleport } from "./teleport.js";
import type { VariantSnapshot } from "./types.js";

export function getVariantStatus(v: VariantSnapshot): GameStatus {
  if (v.phase === "place_black_king") {
    return { kind: "playing", inCheck: false };
  }

  if (v.meta.halfmoveClock >= 100) {
    return { kind: "draw", reason: "fifty-move" };
  }

  if (isInsufficientMaterial(v.board)) {
    return { kind: "draw", reason: "insufficient-material" };
  }

  if (v.sideToMove === "white") {
    const lm = legalWhiteMoves(v);
    const checked = inCheck(v.board, "white");
    if (lm.length === 0) {
      if (checked) return { kind: "checkmate", winner: "black" };
      return { kind: "stalemate" };
    }
    return { kind: "playing", inCheck: checked };
  }

  const checked = inCheck(v.board, "black");
  const move = legalBlackBoardMoves(v).length > 0;
  const add = blackHasLegalAdd(v);
  const tp = canBlackTeleport(v) && blackHasLegalTeleport(v);

  if (!move && !add && !tp) {
    if (checked) return { kind: "checkmate", winner: "white" };
    return { kind: "stalemate" };
  }

  return { kind: "playing", inCheck: checked };
}

export function isVariantTerminal(v: VariantSnapshot): boolean {
  const s = getVariantStatus(v);
  return s.kind !== "playing";
}
