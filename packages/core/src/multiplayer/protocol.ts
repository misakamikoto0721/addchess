import type { PieceKind, Square } from "../model/types.js";
import type { WireVariantSnapshot } from "./wire.js";

export type Seat = "white" | "black";

/** 房间内连接位：房主 / 加入者（与颜色无关，开局前选边） */
export type PlayerSlot = "host" | "guest";

/** 大厅选边与准备状态 */
export type LobbyState = {
  playerCount: number;
  hostSeatChoice: Seat | null;
  guestSeatChoice: Seat | null;
  hostReady: boolean;
  guestReady: boolean;
};

/** 双方已选不同阵营 */
export function seatsChosenForGame(lobby: LobbyState): boolean {
  return (
    lobby.playerCount === 2 &&
    lobby.hostSeatChoice !== null &&
    lobby.guestSeatChoice !== null &&
    lobby.hostSeatChoice !== lobby.guestSeatChoice
  );
}

/** 满足选边且双方均已准备 → 可自动开局 */
export function shouldAutoStartGame(lobby: LobbyState): boolean {
  return seatsChosenForGame(lobby) && lobby.hostReady && lobby.guestReady;
}

/** @deprecated 使用 seatsChosenForGame */
export function canStartLobby(lobby: LobbyState): boolean {
  return seatsChosenForGame(lobby);
}

/** 房间同步 payload（局面 + 加子流程 + 悔棋申请） */
export type RoomSync = {
  variant: WireVariantSnapshot;
  awaitingWhitePickKind: boolean;
  pendingAddKind: PieceKind | null;
  /** 正在等待应答的悔棋申请方；null 表示无 */
  pendingUndoFrom: Seat | null;
};

/** 浏览器 → 服务器 */
export type ClientMessage =
  | { type: "createRoom" }
  | { type: "joinRoom"; roomId: string }
  | { type: "chooseSeat"; seat: Seat }
  | { type: "setReady"; ready: boolean }
  | { type: "placeKing"; to: Square }
  | {
      type: "move";
      from: Square;
      to: Square;
      promotion?: PieceKind;
    }
  | { type: "beginAdd" }
  | { type: "pickAddKind"; kind: PieceKind }
  | {
      type: "addPiece";
      to: Square;
      promotion?: PieceKind;
    }
  | { type: "teleport"; to: Square }
  | { type: "cancelAdd" }
  | { type: "requestUndo" }
  | { type: "respondUndo"; accept: boolean };

/** 服务器 → 浏览器 */
export type ServerMessage =
  | { type: "roomCreated"; roomId: string; slot: PlayerSlot; lobby: LobbyState }
  | {
      type: "joined";
      roomId: string;
      slot: PlayerSlot;
      lobby: LobbyState;
    }
  | { type: "lobbyUpdate"; lobby: LobbyState }
  | { type: "playerJoined"; playerCount: number }
  | { type: "playerLeft"; playerCount: number }
  | { type: "opponentLeft"; seat: Seat }
  | { type: "gameStarted"; seat: Seat; sync: RoomSync }
  | { type: "sync"; sync: RoomSync }
  | { type: "undoDeclined" }
  | { type: "error"; message: string };

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (!raw || typeof raw !== "object" || !("type" in raw)) return null;
  return raw as ClientMessage;
}
