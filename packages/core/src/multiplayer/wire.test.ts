import { describe, expect, it } from "vitest";
import {
  applyPlaceBlackKing,
  createVariantInitial,
  variantFromWire,
  variantToWire,
} from "../index.js";

describe("variant wire roundtrip", () => {
  it("preserves snapshot after toWire/fromWire", () => {
    let v = createVariantInitial();
    const placed = applyPlaceBlackKing(v, { file: 4, rank: 0 });
    expect(placed).not.toBeNull();
    v = placed!;

    const w = variantToWire(v);
    const back = variantFromWire(w);

    expect(back.phase).toBe(v.phase);
    expect(back.sideToMove).toBe(v.sideToMove);
    expect(back.board.size).toBe(v.board.size);
    expect(back.pieceIds.size).toBe(v.pieceIds.size);
    expect(back.reserve).toEqual(v.reserve);
  });
});
