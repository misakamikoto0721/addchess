import type { WebSocket } from "ws";
import {
  cloneVariant,
  type PieceKind,
  type VariantSnapshot,
} from "@addchess/core";
import type { Seat } from "@addchess/core";

export type RoomPhase = "waiting" | "playing";

export type RoomHistoryEntry = {
  variant: VariantSnapshot;
  awaitingWhitePickKind: boolean;
  pendingAddKind: PieceKind | null;
};

export type Room = {
  id: string;
  phase: RoomPhase;
  players: Partial<Record<Seat, WebSocket>>;
  variant: VariantSnapshot | null;
  awaitingWhitePickKind: boolean;
  pendingAddKind: PieceKind | null;
  pendingUndoFrom: Seat | null;
  history: RoomHistoryEntry[];
};

const rooms = new Map<string, Room>();
const socketMeta = new WeakMap<WebSocket, { roomId: string; seat: Seat }>();

export function createRoomId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function playerCount(room: Room): number {
  return (room.players.white ? 1 : 0) + (room.players.black ? 1 : 0);
}

export function createRoom(): Room {
  let id = createRoomId();
  while (rooms.has(id)) id = createRoomId();
  const room: Room = {
    id,
    phase: "waiting",
    players: {},
    variant: null,
    awaitingWhitePickKind: false,
    pendingAddKind: null,
    pendingUndoFrom: null,
    history: [],
  };
  rooms.set(id, room);
  return room;
}

export function attachPlayer(
  room: Room,
  seat: Seat,
  ws: WebSocket,
): boolean {
  if (room.players[seat]) return false;
  room.players[seat] = ws;
  socketMeta.set(ws, { roomId: room.id, seat });
  return true;
}

export function detachSocket(ws: WebSocket): {
  room: Room | undefined;
  seat: Seat | undefined;
} {
  const meta = socketMeta.get(ws);
  if (!meta) return { room: undefined, seat: undefined };
  const room = rooms.get(meta.roomId);
  const seat = meta.seat;
  if (room) {
    if (room.players[meta.seat] === ws) {
      delete room.players[meta.seat];
    }
    if (playerCount(room) === 0) {
      rooms.delete(room.id);
    }
  }
  socketMeta.delete(ws);
  return { room, seat };
}

export function getSocketMeta(
  ws: WebSocket,
): { roomId: string; seat: Seat } | undefined {
  return socketMeta.get(ws);
}

export function resetAddFlow(room: Room): void {
  room.awaitingWhitePickKind = false;
  room.pendingAddKind = null;
}

export function saveHistory(room: Room): void {
  if (!room.variant) return;
  room.history.push({
    variant: cloneVariant(room.variant),
    awaitingWhitePickKind: room.awaitingWhitePickKind,
    pendingAddKind: room.pendingAddKind,
  });
}

export function clearUndoRequest(room: Room): void {
  room.pendingUndoFrom = null;
}

export function restoreHistory(room: Room): boolean {
  const prev = room.history.pop();
  if (!prev) return false;
  room.variant = prev.variant;
  room.awaitingWhitePickKind = prev.awaitingWhitePickKind;
  room.pendingAddKind = prev.pendingAddKind;
  room.pendingUndoFrom = null;
  return true;
}
