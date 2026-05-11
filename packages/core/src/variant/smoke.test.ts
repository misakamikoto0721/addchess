import { describe, expect, it } from "vitest";
import {
  applyPlaceBlackKing,
  createVariantInitial,
  legalWhiteMoves,
} from "./index.js";

describe("variant smoke", () => {
  it("after king placement white has moves", () => {
    let v = createVariantInitial();
    const placed = applyPlaceBlackKing(v, { file: 4, rank: 0 });
    expect(placed).not.toBeNull();
    v = placed!;
    expect(v.phase).toBe("play");
    expect(v.sideToMove).toBe("white");
    expect(legalWhiteMoves(v).length).toBeGreaterThan(0);
  });
});
