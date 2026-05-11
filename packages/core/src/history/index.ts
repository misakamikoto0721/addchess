import type { GameSnapshot, Move } from "../model/types.js";
import { applyMove } from "../moves/index.js";

export type GameHistory = {
  initial: GameSnapshot;
  moves: Move[];
};

export function replay(history: GameHistory): GameSnapshot {
  let snap: GameSnapshot = structuredClone(history.initial);
  for (const m of history.moves) {
    snap = applyMove(snap, m);
  }
  return snap;
}
