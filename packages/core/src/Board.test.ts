import { describe, expect, it } from "vitest";
import {
  applyMove,
  createStandardGame,
  getGameStatus,
  legalMoves,
  squareKey,
  type Move,
} from "./index.js";

function findMove(moves: Move[], partial: Partial<Move> & Pick<Move, "from" | "to">) {
  return moves.find(
    (m) =>
      m.from.file === partial.from.file &&
      m.from.rank === partial.from.rank &&
      m.to.file === partial.to.file &&
      m.to.rank === partial.to.rank &&
      (partial.promotion === undefined || m.promotion === partial.promotion),
  );
}

describe("standard chess", () => {
  it("starts with 20 legal moves for White", () => {
    const g = createStandardGame();
    expect(legalMoves(g)).toHaveLength(20);
  });

  it("applies e2–e4 and toggles side", () => {
    let g = createStandardGame();
    const m = findMove(legalMoves(g), {
      from: { file: 4, rank: 6 },
      to: { file: 4, rank: 4 },
    });
    expect(m).toBeDefined();
    g = applyMove(g, m!);
    expect(g.sideToMove).toBe("black");
    expect(g.board.get(squareKey({ file: 4, rank: 4 }))?.kind).toBe("pawn");
    expect(g.board.has(squareKey({ file: 4, rank: 6 }))).toBe(false);
  });

  it("detects Scholar's Mate pattern reaches mate on Qxf7", () => {
    const seq: Move[] = [
      { from: { file: 4, rank: 6 }, to: { file: 4, rank: 4 } },
      { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 } },
      { from: { file: 5, rank: 7 }, to: { file: 2, rank: 4 } },
      { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 } },
      { from: { file: 3, rank: 7 }, to: { file: 7, rank: 3 } },
      { from: { file: 6, rank: 0 }, to: { file: 5, rank: 2 } },
      {
        from: { file: 7, rank: 3 },
        to: { file: 5, rank: 1 },
        promotion: undefined,
      },
    ];

    let g = createStandardGame();
    for (let i = 0; i < seq.length - 1; i++) {
      const cand = findMove(legalMoves(g), seq[i]!);
      expect(cand, `step ${i}`).toBeDefined();
      g = applyMove(g, cand!);
    }

    const mateBase = seq[seq.length - 1]!;
    const mates = legalMoves(g).filter(
      (m) =>
        m.from.file === mateBase.from.file &&
        m.from.rank === mateBase.from.rank &&
        m.to.file === mateBase.to.file &&
        m.to.rank === mateBase.to.rank,
    );
    expect(mates.length).toBeGreaterThanOrEqual(1);
    g = applyMove(g, mates[0]!);
    expect(getGameStatus(g).kind).toBe("checkmate");
  });
});
