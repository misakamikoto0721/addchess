import type { GameSnapshot, Move } from "../../model/types.js";
import { generatePseudoLegalMoves } from "../../chess/pseudoLegalMoves.js";
import type { RuleEngine } from "../RuleEngine.js";

/** Experimental: pseudo-legal only (no check filtering). Replace with your rules. */
export const yourVariantRuleEngine: RuleEngine = {
  legalMoves(snapshot: GameSnapshot): Move[] {
    return generatePseudoLegalMoves(snapshot);
  },
  isTerminal(_snapshot: GameSnapshot): boolean {
    return false;
  },
};
