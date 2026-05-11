import type { GameSnapshot, Move } from "../model/types.js";

export interface RuleEngine {
  legalMoves(snapshot: GameSnapshot): Move[];
  isTerminal(snapshot: GameSnapshot): boolean;
}
