import type { WebSocket } from "ws";
import {
  cloneVariant,
  type PieceKind,
  type PlayerSlot,
  type Seat,
  type VariantSnapshot,
} from "@addchess/core";

export type RoomPhase = "waiting" | "playing";

export type RoomHistoryEntry = {
  variant: VariantSnapshot;
  awaitingWhitePickKind: boolean;
  pendingAddKind: PieceKind | null;
};

export type Room = {
  id: string;
  phase: RoomPhase;
  /** 大厅连接位（开局前） */
  slots: Partial<Record<PlayerSlot, WebSocket>>;
  /** 各连接位选边（开局前） */
  seatChoices: Partial<Record<PlayerSlot, Seat>>;
  /** 各连接位是否已准备 */
  ready: Partial<Record<PlayerSlot, boolean>>;
  /** 开局后按颜色索引的连接 */
  players: Partial<Record<Seat, WebSocket>>;
  variant: VariantSnapshot | null;
  awaitingWhitePickKind: boolean;
  pendingAddKind: PieceKind | null;
  pendingUndoFrom: Seat | null;
  history: RoomHistoryEntry[];
};

const rooms = new Map<string, Room>();

type SocketMeta = {
  roomId: string;
  slot: PlayerSlot;
  seat?: Seat;
};

const socketMeta = new WeakMap<WebSocket, SocketMeta>();

export function createRoomId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function playerCount(room: Room): number {
  return (room.slots.host ? 1 : 0) + (room.slots.guest ? 1 : 0);
}

export function lobbyState(room: Room): {
  playerCount: number;
  hostSeatChoice: Seat | null;
  guestSeatChoice: Seat | null;
  hostReady: boolean;
  guestReady: boolean;
} {
  return {
    playerCount: playerCount(room),
    hostSeatChoice: room.seatChoices.host ?? null,
    guestSeatChoice: room.seatChoices.guest ?? null,
    hostReady: Boolean(room.ready.host),
    guestReady: Boolean(room.ready.guest),
  };
}

export function createRoom(): Room {
  let id = createRoomId();
  while (rooms.has(id)) id = createRoomId();
  const room: Room = {
    id,
    phase: "waiting",
    slots: {},
    seatChoices: {},
    ready: {},
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

export function attachSlot(
  room: Room,
  slot: PlayerSlot,
  ws: WebSocket,
): boolean {
  if (room.slots[slot]) return false;
  room.slots[slot] = ws;
  socketMeta.set(ws, { roomId: room.id, slot });
  return true;
}

export function setSeatChoice(
  room: Room,
  slot: PlayerSlot,
  seat: Seat,
): void {
  room.seatChoices[slot] = seat;
  clearAllReady(room);
}

export function setReady(room: Room, slot: PlayerSlot, ready: boolean): void {
  if (ready) room.ready[slot] = true;
  else delete room.ready[slot];
}

export function clearAllReady(room: Room): void {
  room.ready = {};
}

export function clearSeatChoice(room: Room, slot: PlayerSlot): void {
  delete room.seatChoices[slot];
}

/** 将选边结果写入 players 与 socket meta（开局前调用） */
export function finalizeSeatAssignments(room: Room): boolean {
  const hostSeat = room.seatChoices.host;
  const guestSeat = room.seatChoices.guest;
  const hostWs = room.slots.host;
  const guestWs = room.slots.guest;
  if (!hostSeat || !guestSeat || hostSeat === guestSeat || !hostWs || !guestWs) {
    return false;
  }
  room.players = {
    [hostSeat]: hostWs,
    [guestSeat]: guestWs,
  };
  socketMeta.set(hostWs, { roomId: room.id, slot: "host", seat: hostSeat });
  socketMeta.set(guestWs, { roomId: room.id, slot: "guest", seat: guestSeat });
  return true;
}

export function detachSocket(ws: WebSocket): {
  room: Room | undefined;
  slot: PlayerSlot | undefined;
  seat: Seat | undefined;
} {
  const meta = socketMeta.get(ws);
  if (!meta) return { room: undefined, slot: undefined, seat: undefined };
  const room = rooms.get(meta.roomId);
  const { slot, seat } = meta;
  if (room) {
    if (room.slots.host === ws) delete room.slots.host;
    if (room.slots.guest === ws) delete room.slots.guest;
    if (seat && room.players[seat] === ws) delete room.players[seat];
    clearSeatChoice(room, slot);
    delete room.ready[slot];
    if (playerCount(room) === 0) {
      rooms.delete(room.id);
    }
  }
  socketMeta.delete(ws);
  return { room, slot, seat };
}

export function getSocketMeta(ws: WebSocket): SocketMeta | undefined {
  return socketMeta.get(ws);
}

export function getPlayerSeat(ws: WebSocket): Seat | undefined {
  return socketMeta.get(ws)?.seat;
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

export function resetRoomToLobby(room: Room): void {
  room.phase = "waiting";
  room.players = {};
  room.variant = null;
  room.history = [];
  room.seatChoices = {};
  room.ready = {};
  resetAddFlow(room);
  clearUndoRequest(room);
  for (const ws of Object.values(room.slots)) {
    if (!ws) continue;
    const meta = socketMeta.get(ws);
    if (meta) socketMeta.set(ws, { roomId: room.id, slot: meta.slot });
  }
}
