export * from "./model/index.js";
export * from "./moves/index.js";
export * from "./rules/index.js";
export * from "./history/index.js";

export { createStandardGame, defaultChessMeta } from "./chess/position.js";
export { getGameStatus, isInsufficientMaterial } from "./chess/status.js";
export { inCheck, isSquareAttacked, findKing } from "./chess/attacks.js";

export * from "./variant/index.js";
