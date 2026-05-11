import type { Square } from "../model/types.js";

export function onBoard(s: Square): boolean {
  return s.file >= 0 && s.file < 8 && s.rank >= 0 && s.rank < 8;
}

export function sameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export const KNIGHT_DELTAS: readonly Square[] = [
  { file: 1, rank: 2 },
  { file: 2, rank: 1 },
  { file: 2, rank: -1 },
  { file: 1, rank: -2 },
  { file: -1, rank: -2 },
  { file: -2, rank: -1 },
  { file: -2, rank: 1 },
  { file: -1, rank: 2 },
];

export const KING_DELTAS: readonly Square[] = (() => {
  const d: Square[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      d.push({ file: df, rank: dr });
    }
  }
  return d;
})();

export const ROOK_DIRS: readonly Square[] = [
  { file: 1, rank: 0 },
  { file: -1, rank: 0 },
  { file: 0, rank: 1 },
  { file: 0, rank: -1 },
];

export const BISHOP_DIRS: readonly Square[] = [
  { file: 1, rank: 1 },
  { file: 1, rank: -1 },
  { file: -1, rank: 1 },
  { file: -1, rank: -1 },
];
