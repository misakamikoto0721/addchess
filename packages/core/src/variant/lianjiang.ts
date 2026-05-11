import { findKing, inCheck } from "../chess/attacks.js";
import { squaresAttacking } from "../chess/pieceAttacks.js";
import { squareKey } from "../model/Board.js";
import type { BoardState, Square } from "../model/types.js";
import { threeCategoriesInReserve } from "./reserve.js";
import type { VariantSnapshot } from "./types.js";

/**
 * `pieceIdsAfterMove` 必须与 `nextBoard` 同步（走子后的 id 映射）。
 * 若误用走子前的 `v.pieceIds`，攻击格上的棋子 id 会查不到，连将计数永远不会记入该子。
 */
export function computeLianjiangAfterWhite(
  v: VariantSnapshot,
  nextBoard: BoardState,
  pieceIdsAfterMove: Map<string, string>,
): Pick<VariantSnapshot, "lianjiangSequence" | "whiteCheckUsedIds"> {
  const blackChecked = inCheck(nextBoard, "black");
  if (!blackChecked) {
    return { lianjiangSequence: false, whiteCheckUsedIds: [] };
  }

  const kingSq = findKing(nextBoard, "black");
  if (!kingSq) {
    return { lianjiangSequence: false, whiteCheckUsedIds: [] };
  }

  if (!threeCategoriesInReserve(v.reserve)) {
    return { lianjiangSequence: false, whiteCheckUsedIds: [] };
  }

  const attackers = squaresAttacking(nextBoard, kingSq, "white");
  const newIds = attackers
    .map((sq) => pieceIdsAfterMove.get(squareKey(sq)))
    .filter((x): x is string => Boolean(x));

  return {
    lianjiangSequence: true,
    whiteCheckUsedIds: [...new Set([...v.whiteCheckUsedIds, ...newIds])],
  };
}

/** True if any piece id that already spent check currently attacks black king. */
export function violatesExhaustedCheckers(
  v: VariantSnapshot,
  board: BoardState,
  pieceIdsForBoard: Map<string, string> = v.pieceIds,
): boolean {
  const kingSq = findKing(board, "black");
  if (!kingSq) return false;
  const attackers = squaresAttacking(board, kingSq, "white");
  const used = new Set(v.whiteCheckUsedIds);
  for (const sq of attackers) {
    const id = pieceIdsForBoard.get(squareKey(sq));
    if (id && used.has(id)) return true;
  }
  return false;
}

export function kingSquareAfterTeleport(
  v: VariantSnapshot,
  from: Square,
  to: Square,
): Map<string, string> {
  const ids = new Map(v.pieceIds);
  const fk = squareKey(from);
  const tk = squareKey(to);
  const kid = ids.get(fk);
  ids.delete(fk);
  if (kid) ids.set(tk, kid);
  return ids;
}
