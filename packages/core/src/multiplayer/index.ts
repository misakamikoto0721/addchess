export type {
  ClientMessage,
  LobbyState,
  PlayerSlot,
  RoomSync,
  Seat,
  ServerMessage,
} from "./protocol.js";
export { canStartLobby, parseClientMessage, seatsChosenForGame, shouldAutoStartGame } from "./protocol.js";
export type { WireVariantSnapshot } from "./wire.js";
export { syncFromVariant, variantFromWire, variantToWire } from "./wire.js";
