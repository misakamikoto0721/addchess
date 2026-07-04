import { describe, expect, it } from "vitest";
import { applyPlaceBlackKing, createVariantInitial } from "./index.js";
import { whiteLegalPieceKinds } from "./addPiece.js";
import type { VariantSnapshot } from "./types.js";

function playReady(): VariantSnapshot {
  let v = createVariantInitial();
  const p = applyPlaceBlackKing(v, { file: 4, rank: 0 });
  expect(p).not.toBeNull();
  return p!;
}

describe("whiteLegalPieceKinds streak vs single-category reserve", () => {
  it("still applies streak when two or more categories have stock", () => {
    let v = playReady();
    v = {
      ...v,
      reserve: {
        pawn: 2,
        knight: 0,
        bishop: 0,
        rook: 1,
        queen: 0,
      },
      whiteAddStreak: { pawn: 0, light: 0, heavy: 1 },
    };
    const kinds = whiteLegalPieceKinds(v);
    expect(kinds).toContain("pawn");
    expect(kinds).not.toContain("rook");
  });

  it("ignores streak when only one category has stock (e.g. heavy only)", () => {
    let v = playReady();
    v = {
      ...v,
      reserve: {
        pawn: 0,
        knight: 0,
        bishop: 0,
        rook: 2,
        queen: 1,
      },
      whiteAddStreak: { pawn: 0, light: 0, heavy: 1 },
    };
    const kinds = whiteLegalPieceKinds(v);
    expect(kinds.sort()).toEqual(["queen", "rook"]);
  });

  it("ignores streak when only pawns remain", () => {
    let v = playReady();
    v = {
      ...v,
      reserve: {
        pawn: 3,
        knight: 0,
        bishop: 0,
        rook: 0,
        queen: 0,
      },
      whiteAddStreak: { pawn: 2, light: 0, heavy: 0 },
    };
    expect(whiteLegalPieceKinds(v)).toContain("pawn");
  });
});
