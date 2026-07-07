import type { WebSocket } from "ws";
import {
  applyBlackAdd,
  applyBlackTeleport,
  applyNormalMove,
  applyPlaceBlackKing,
  blackHasLegalAdd,
  shouldAutoStartGame,
  createVariantInitial,
  legalBlackBoardMoves,
  legalWhiteMoves,
  syncFromVariant,
  whiteLegalPieceKinds,
  type ClientMessage,
  type PlayerSlot,
  type Seat,
  type ServerMessage,
  type Square,
} from "@addchess/core";
import type { Room } from "./rooms.js";
import {
  attachSlot,
  clearUndoRequest,
  createRoom as newRoom,
  detachSocket,
  finalizeSeatAssignments,
  getPlayerSeat,
  getRoom,
  getSocketMeta,
  lobbyState,
  playerCount,
  resetAddFlow,
  resetRoomToLobby,
  restoreHistory,
  saveHistory,
  setReady,
  setSeatChoice,
} from "./rooms.js";

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMessage): void {
  for (const ws of Object.values(room.slots)) {
    if (ws) send(ws, msg);
  }
}

function broadcastLobby(room: Room): void {
  broadcast(room, { type: "lobbyUpdate", lobby: lobbyState(room) });
}

function pushSync(room: Room): void {
  if (!room.variant) return;
  broadcast(room, {
    type: "sync",
    sync: syncFromVariant(
      room.variant,
      room.awaitingWhitePickKind,
      room.pendingAddKind,
      room.pendingUndoFrom,
    ),
  });
}

function reject(ws: WebSocket, message: string): void {
  send(ws, { type: "error", message });
}

function requirePlaying(room: Room, ws: WebSocket): boolean {
  if (room.phase !== "playing" || !room.variant) {
    reject(ws, "对局尚未开始");
    return false;
  }
  return true;
}

function opponentSlot(slot: PlayerSlot): PlayerSlot {
  return slot === "host" ? "guest" : "host";
}

function applyMoveMatching(
  room: Room,
  from: Square,
  to: Square,
  promotion?: import("@addchess/core").PieceKind,
): boolean {
  const v = room.variant!;
  const lm =
    v.sideToMove === "white"
      ? legalWhiteMoves(v)
      : legalBlackBoardMoves(v);
  const cand = lm.filter(
    (m) =>
      m.from.file === from.file &&
      m.from.rank === from.rank &&
      m.to.file === to.file &&
      m.to.rank === to.rank,
  );
  if (cand.length === 0) return false;
  const pick =
    promotion !== undefined
      ? cand.find((m) => m.promotion === promotion)
      : cand.length === 1
        ? cand[0]
        : undefined;
  if (!pick) return false;
  saveHistory(room);
  const next = applyNormalMove(v, pick);
  if (!next) {
    room.history.pop();
    return false;
  }
  room.variant = next;
  resetAddFlow(room);
  clearUndoRequest(room);
  return true;
}

function inAddFlow(room: Room): boolean {
  return room.awaitingWhitePickKind || room.pendingAddKind !== null;
}

function tryBeginGame(room: Room): void {
  const lobby = lobbyState(room);
  if (!shouldAutoStartGame(lobby)) return;
  if (!finalizeSeatAssignments(room)) return;
  room.phase = "playing";
  room.variant = createVariantInitial();
  room.history = [];
  resetAddFlow(room);
  clearUndoRequest(room);
  const sync = syncFromVariant(room.variant, false, null, null);
  for (const slot of ["host", "guest"] as const) {
    const slotWs = room.slots[slot];
    const seat = room.seatChoices[slot];
    if (slotWs && seat) {
      send(slotWs, { type: "gameStarted", seat, sync });
    }
  }
}

export function handleClientMessage(ws: WebSocket, msg: ClientMessage): void {
  switch (msg.type) {
    case "createRoom": {
      const room = newRoom();
      attachSlot(room, "host", ws);
      send(ws, {
        type: "roomCreated",
        roomId: room.id,
        slot: "host",
        lobby: lobbyState(room),
      });
      return;
    }

    case "joinRoom": {
      const room = getRoom(msg.roomId);
      if (!room) {
        reject(ws, "房间不存在");
        return;
      }
      if (room.phase !== "waiting") {
        reject(ws, "对局已开始，无法加入");
        return;
      }
      if (playerCount(room) >= 2) {
        reject(ws, "房间已满");
        return;
      }
      if (!attachSlot(room, "guest", ws)) {
        reject(ws, "无法加入房间");
        return;
      }
      send(ws, {
        type: "joined",
        roomId: room.id,
        slot: "guest",
        lobby: lobbyState(room),
      });
      if (room.slots.host) {
        send(room.slots.host, {
          type: "playerJoined",
          playerCount: playerCount(room),
        });
      }
      broadcastLobby(room);
      return;
    }

    case "chooseSeat": {
      const meta = getSocketMeta(ws);
      if (!meta) {
        reject(ws, "尚未加入房间");
        return;
      }
      const room = getRoom(meta.roomId);
      if (!room || room.phase !== "waiting") {
        reject(ws, "当前不能选边");
        return;
      }
      const other = opponentSlot(meta.slot);
      if (room.seatChoices[other] === msg.seat) {
        reject(ws, "对方已选择该边");
        return;
      }
      setSeatChoice(room, meta.slot, msg.seat);
      broadcastLobby(room);
      return;
    }

    case "setReady": {
      const meta = getSocketMeta(ws);
      if (!meta) {
        reject(ws, "尚未加入房间");
        return;
      }
      const room = getRoom(meta.roomId);
      if (!room || room.phase !== "waiting") {
        reject(ws, "当前不能准备");
        return;
      }
      if (!room.seatChoices[meta.slot]) {
        reject(ws, "请先选择阵营");
        return;
      }
      if (playerCount(room) < 2) {
        reject(ws, "等待对手加入");
        return;
      }
      setReady(room, meta.slot, msg.ready);
      broadcastLobby(room);
      tryBeginGame(room);
      return;
    }

    case "placeKing": {
      const seat = getPlayerSeat(ws);
      if (!seat || seat !== "black") {
        reject(ws, "仅黑方可放置王");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      saveHistory(room);
      const next = applyPlaceBlackKing(room.variant!, msg.to);
      if (!next) {
        room.history.pop();
        reject(ws, "无法在该格放置王");
        return;
      }
      room.variant = next;
      resetAddFlow(room);
      clearUndoRequest(room);
      pushSync(room);
      return;
    }

    case "move": {
      const seat = getPlayerSeat(ws);
      if (!seat) {
        reject(ws, "尚未加入房间");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (room.variant!.sideToMove !== seat) {
        reject(ws, "还没轮到你");
        return;
      }
      if (inAddFlow(room)) {
        reject(ws, "请先完成加子流程");
        return;
      }
      if (room.pendingUndoFrom) {
        reject(ws, "请先处理悔棋申请");
        return;
      }
      if (!applyMoveMatching(room, msg.from, msg.to, msg.promotion)) {
        reject(ws, "非法走法");
        return;
      }
      pushSync(room);
      return;
    }

    case "beginAdd": {
      const seat = getPlayerSeat(ws);
      if (!seat || seat !== "black") {
        reject(ws, "仅黑方可发起加子");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (room.variant!.sideToMove !== "black") {
        reject(ws, "还没轮到黑方");
        return;
      }
      if (!blackHasLegalAdd(room.variant!)) {
        reject(ws, "当前无法加子");
        return;
      }
      if (room.pendingUndoFrom) {
        reject(ws, "请先处理悔棋申请");
        return;
      }
      room.awaitingWhitePickKind = true;
      room.pendingAddKind = null;
      clearUndoRequest(room);
      pushSync(room);
      return;
    }

    case "pickAddKind": {
      const seat = getPlayerSeat(ws);
      if (!seat || seat !== "white") {
        reject(ws, "仅白方可指定兵种");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (!room.awaitingWhitePickKind) {
        reject(ws, "当前不在选兵种阶段");
        return;
      }
      if (!whiteLegalPieceKinds(room.variant!).includes(msg.kind)) {
        reject(ws, "不能指定该兵种");
        return;
      }
      room.awaitingWhitePickKind = false;
      room.pendingAddKind = msg.kind;
      pushSync(room);
      return;
    }

    case "addPiece": {
      const seat = getPlayerSeat(ws);
      if (!seat || seat !== "black") {
        reject(ws, "仅黑方可落子");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (!room.pendingAddKind) {
        reject(ws, "白方尚未指定兵种");
        return;
      }
      saveHistory(room);
      const next = applyBlackAdd(
        room.variant!,
        room.pendingAddKind,
        msg.to,
        msg.promotion,
      );
      if (!next) {
        room.history.pop();
        reject(ws, "无法在该格加子");
        return;
      }
      room.variant = next;
      resetAddFlow(room);
      clearUndoRequest(room);
      pushSync(room);
      return;
    }

    case "teleport": {
      const seat = getPlayerSeat(ws);
      if (!seat || seat !== "black") {
        reject(ws, "仅黑方可空降");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (room.variant!.sideToMove !== "black") {
        reject(ws, "还没轮到黑方");
        return;
      }
      if (room.pendingUndoFrom) {
        reject(ws, "请先处理悔棋申请");
        return;
      }
      saveHistory(room);
      const next = applyBlackTeleport(room.variant!, msg.to);
      if (!next) {
        room.history.pop();
        reject(ws, "无法空降至该格");
        return;
      }
      room.variant = next;
      resetAddFlow(room);
      clearUndoRequest(room);
      pushSync(room);
      return;
    }

    case "cancelAdd": {
      const meta = getSocketMeta(ws);
      if (!meta) return;
      const room = getRoom(meta.roomId);
      if (!room) return;
      resetAddFlow(room);
      pushSync(room);
      return;
    }

    case "requestUndo": {
      const seat = getPlayerSeat(ws);
      if (!seat) {
        reject(ws, "尚未加入房间");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (inAddFlow(room)) {
        reject(ws, "加子流程中不能悔棋");
        return;
      }
      if (room.pendingUndoFrom) {
        reject(ws, "已有待处理的悔棋申请");
        return;
      }
      if (room.history.length === 0) {
        reject(ws, "没有可悔的步");
        return;
      }
      if (room.variant!.sideToMove === seat) {
        reject(ws, "只能在对手思考时申请悔棋");
        return;
      }
      room.pendingUndoFrom = seat;
      pushSync(room);
      return;
    }

    case "respondUndo": {
      const seat = getPlayerSeat(ws);
      if (!seat) {
        reject(ws, "尚未加入房间");
        return;
      }
      const meta = getSocketMeta(ws);
      const room = meta ? getRoom(meta.roomId) : undefined;
      if (!room || !requirePlaying(room, ws)) return;
      if (!room.pendingUndoFrom) {
        reject(ws, "没有悔棋申请");
        return;
      }
      if (room.variant!.sideToMove !== seat) {
        reject(ws, "仅轮到走棋的一方可回应悔棋");
        return;
      }
      if (room.pendingUndoFrom === seat) {
        reject(ws, "不能回应自己的悔棋申请");
        return;
      }
      if (msg.accept) {
        if (!restoreHistory(room)) {
          reject(ws, "悔棋失败");
          return;
        }
        pushSync(room);
      } else {
        const requester = room.pendingUndoFrom;
        clearUndoRequest(room);
        pushSync(room);
        const requesterWs = room.players[requester];
        if (requesterWs) send(requesterWs, { type: "undoDeclined" });
      }
      return;
    }

    default:
      reject(ws, "未知消息类型");
  }
}

export function onSocketClose(ws: WebSocket): void {
  const meta = getSocketMeta(ws);
  if (!meta) return;

  const room = getRoom(meta.roomId);
  if (!room) {
    detachSocket(ws);
    return;
  }

  const leftSeat = meta.seat;
  const wasPlaying = room.phase === "playing";

  detachSocket(ws);

  const remaining = getRoom(meta.roomId);
  if (!remaining || playerCount(remaining) === 0) return;

  if (wasPlaying) {
    resetRoomToLobby(remaining);
    broadcast(remaining, {
      type: "opponentLeft",
      seat: leftSeat ?? "white",
    });
    broadcastLobby(remaining);
  } else {
    broadcast(remaining, {
      type: "playerLeft",
      playerCount: playerCount(remaining),
    });
    broadcastLobby(remaining);
  }
}
