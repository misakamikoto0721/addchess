import { pieceAt, squareKey } from "../model/Board.js";
import type { Move } from "../model/types.js";
import type { VariantSnapshot } from "./types.js";

/** Piece id map after a normal move (same rules as applyNormalMove). */
export function pieceIdsAfterNormalMove(
  v: VariantSnapshot,
  move: Move,
): Map<string, string> | null {
  const baseBoard = v.board;
  const moving = pieceAt(baseBoard, move.from);
  if (!moving || moving.side !== v.sideToMove) return null;

  const ids = new Map(v.pieceIds);
  const fromK = squareKey(move.from);
  const toK = squareKey(move.to);

  if (moving.kind === "king" && Math.abs(move.to.file - move.from.file) === 2) {
    const r = move.from.rank;
    const ks = move.to.file === 6;
    const rookFromK = squareKey({ file: ks ? 7 : 0, rank: r });
    const rookToK = squareKey({ file: ks ? 5 : 3, rank: r });
    const kid = ids.get(fromK);
    const rid = ids.get(rookFromK);
    ids.delete(fromK);
    ids.delete(rookFromK);
    if (kid) ids.set(toK, kid);
    if (rid) ids.set(rookToK, rid);
  } else {
    const id = ids.get(fromK);
    const captured = pieceAt(baseBoard, move.to);
    const isEp =
      moving.kind === "pawn" &&
      move.from.file !== move.to.file &&
      !captured;

    ids.delete(fromK);
    if (captured) ids.delete(toK);
    if (isEp) {
      const vr =
        moving.side === "white"
          ? move.to.rank + 1
          : move.to.rank - 1;
      ids.delete(squareKey({ file: move.to.file, rank: vr }));
    }
    if (id) ids.set(toK, id);
  }

  return ids;
}
