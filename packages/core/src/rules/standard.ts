import type { GameSnapshot, Move } from "../model/types.js";
import { legalMoves } from "../chess/legalMoves.js";
import { getGameStatus } from "../chess/status.js";
import type { RuleEngine } from "./RuleEngine.js";

export const standardRuleEngine: RuleEngine = {
  legalMoves(snapshot: GameSnapshot): Move[] {
    return legalMoves(snapshot);
  },
  isTerminal(snapshot: GameSnapshot): boolean {
    const s = getGameStatus(snapshot);
    return s.kind !== "playing";
  },
};
