import type { PieceKind, Square } from "../model/types.js";
import type { WireVariantSnapshot } from "./wire.js";

export type Seat = "white" | "black";

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
  | { type: "startGame" }
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
  | { type: "roomCreated"; roomId: string; seat: Seat }
  | {
      type: "joined";
      roomId: string;
      seat: Seat;
      playerCount: number;
    }
  | { type: "playerJoined"; playerCount: number }
  | { type: "playerLeft"; playerCount: number }
  | { type: "opponentLeft"; seat: Seat }
  | { type: "gameStarted"; sync: RoomSync }
  | { type: "sync"; sync: RoomSync }
  | { type: "undoDeclined" }
  | { type: "error"; message: string };

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (!raw || typeof raw !== "object" || !("type" in raw)) return null;
  return raw as ClientMessage;
}
