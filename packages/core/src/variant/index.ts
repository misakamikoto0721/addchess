export type {
  AddCategory,
  BlackReserve,
  VariantPhase,
  VariantSnapshot,
  WhiteAddStreak,
} from "./types.js";
export { createVariantInitial } from "./create.js";
export { cloneVariant, toGameSnapshot } from "./snapshot.js";
export {
  fullBlackReserve,
  teleportCategoryUnlocked,
  threeCategoriesInReserve,
} from "./reserve.js";
export {
  addCategoryForKind,
  applyBlackAdd,
  kindsAvailableInCategory,
  whiteLegalAddCategories,
  whiteLegalPieceKinds,
} from "./addPiece.js";
export {
  applyNormalMove,
  applyPlaceBlackKing,
  blackKingSetupHighlights,
} from "./applyNormal.js";
export {
  applyBlackTeleport,
  canBlackTeleport,
  legalTeleportSquares,
  teleportHighlights,
} from "./teleport.js";
export {
  blackHasLegalAdd,
  blackHasAnyLegalAction,
  blackHasLegalTeleport,
  blackHighlightSquares,
  legalBlackBoardMoves,
  legalWhiteMoves,
  pseudoMovesFrom,
  whiteHighlightSquares,
} from "./legal.js";
export {
  blackAddHighlights,
  legalBlackAddDestinations,
} from "./addSquares.js";
export { getVariantStatus, isVariantTerminal } from "./gameStatus.js";
export { pieceIdsAfterNormalMove } from "./transferIds.js";
