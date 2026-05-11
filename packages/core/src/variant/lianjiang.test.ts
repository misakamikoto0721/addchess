import { describe, expect, it } from "vitest";
import { emptyBoard } from "../model/Board.js";
import { defaultChessMeta } from "../chess/position.js";
import { fullBlackReserve } from "./reserve.js";
import { computeLianjiangAfterWhite } from "./lianjiang.js";
import type { VariantSnapshot } from "./types.js";

function minimalV(over: Partial<VariantSnapshot> = {}): VariantSnapshot {
  return {
    board: emptyBoard(),
    meta: defaultChessMeta(),
    sideToMove: "white",
    phase: "play",
    pieceIds: new Map(),
    nextPieceId: 1,
    reserve: fullBlackReserve(),
    whiteAddStreak: { pawn: 0, light: 0, heavy: 0 },
    blackTeleportUsed: false,
    lianjiangSequence: false,
    whiteCheckUsedIds: [],
    ...over,
  };
}

describe("computeLianjiangAfterWhite", () => {
  it("uses pieceIds aligned with nextBoard so movers get check credit", () => {
    const board = emptyBoard();
    board.set("4,0", { kind: "king", side: "black" });
    board.set("7,3", { kind: "queen", side: "white" });
    const pieceIdsAfterMove = new Map([
      ["4,0", "bk"],
      ["7,3", "wq"],
    ]);
    const v = minimalV();
    const out = computeLianjiangAfterWhite(v, board, pieceIdsAfterMove);
    expect(out.lianjiangSequence).toBe(true);
    expect(out.whiteCheckUsedIds).toContain("wq");
  });

  it("stale pieceIds (pre-move keys) fail to record checkers", () => {
    const board = emptyBoard();
    board.set("4,0", { kind: "king", side: "black" });
    board.set("7,3", { kind: "queen", side: "white" });
    const staleIds = new Map([["3,7", "wq"]]);
    const v = minimalV();
    const out = computeLianjiangAfterWhite(v, board, staleIds);
    expect(out.whiteCheckUsedIds).not.toContain("wq");
  });
});
