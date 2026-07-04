import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ClientMessage,
  GameStatus,
  Move,
  PieceKind,
  RoomSync,
  Seat,
  ServerMessage,
  Square,
  VariantSnapshot,
} from "@addchess/core";
import {
  blackAddHighlights,
  blackHasLegalAdd,
  blackHasLegalTeleport,
  blackHighlightSquares,
  blackKingSetupHighlights,
  getVariantStatus,
  inCheck,
  isVariantTerminal,
  legalBlackBoardMoves,
  legalTeleportSquares,
  legalWhiteMoves,
  pieceAt,
  teleportCategoryUnlocked,
  teleportHighlights,
  variantFromWire,
  whiteHighlightSquares,
  whiteLegalPieceKinds,
} from "@addchess/core";
import type { BlackStep, PromotionPending } from "./useVariantGame.js";

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3000`;

function sameSq(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

function movesMatching(moves: Move[], from: Square, to: Square): Move[] {
  return moves.filter(
    (m) => sameSq(m.from, from) && sameSq(m.to, to),
  );
}

function applySync(
  sync: RoomSync,
  setters: {
    setVariant: (v: VariantSnapshot) => void;
    setAwaitingWhitePickKind: (v: boolean) => void;
    setPendingAddKind: (v: PieceKind | null) => void;
    setPendingUndoFrom: (v: Seat | null) => void;
  },
): void {
  setters.setVariant(variantFromWire(sync.variant));
  setters.setAwaitingWhitePickKind(Boolean(sync.awaitingWhitePickKind));
  setters.setPendingAddKind(sync.pendingAddKind);
  setters.setPendingUndoFrom(sync.pendingUndoFrom ?? null);
}

export type MultiplayerScreen = "lobby" | "game";

export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const [screen, setScreen] = useState<MultiplayerScreen>("lobby");
  const [roomId, setRoomId] = useState("");
  const [seat, setSeat] = useState<Seat | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [lobbyError, setLobbyError] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [connected, setConnected] = useState(false);

  const [variant, setVariant] = useState<VariantSnapshot | null>(null);
  const [awaitingWhitePickKind, setAwaitingWhitePickKind] = useState(false);
  const [pendingAddKind, setPendingAddKind] = useState<PieceKind | null>(null);
  const [pendingUndoFrom, setPendingUndoFrom] = useState<Seat | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [undoNotice, setUndoNotice] = useState("");
  const [selected, setSelected] = useState<Square | null>(null);
  const [localBlackStep, setLocalBlackStep] =
    useState<BlackStep>("pick_action");
  const [promotion, setPromotion] = useState<PromotionPending | null>(null);
  const [actionError, setActionError] = useState("");

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const screenRef = useRef(screen);
  screenRef.current = screen;

  const syncSetters = useMemo(
    () => ({
      setVariant,
      setAwaitingWhitePickKind,
      setPendingAddKind,
      setPendingUndoFrom,
    }),
    [],
  );

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "roomCreated":
        setRoomId(msg.roomId);
        setSeat(msg.seat);
        setPlayerCount(1);
        setLobbyError("");
        setConnected(true);
        break;
      case "joined":
        setRoomId(msg.roomId);
        setSeat(msg.seat);
        setPlayerCount(msg.playerCount);
        setLobbyError("");
        setConnected(true);
        break;
      case "playerJoined":
        setPlayerCount(msg.playerCount);
        setOpponentLeft(false);
        break;
      case "playerLeft":
        setPlayerCount(msg.playerCount);
        break;
      case "opponentLeft":
        setOpponentLeft(true);
        setScreen("lobby");
        setVariant(null);
        setAwaitingWhitePickKind(false);
        setPendingAddKind(null);
        setPendingUndoFrom(null);
        setPromotion(null);
        setSelected(null);
        setPlayerCount(1);
        setActionError("");
        break;
      case "gameStarted":
        applySync(msg.sync, syncSetters);
        setScreen("game");
        setOpponentLeft(false);
        setLocalBlackStep("pick_action");
        setSelected(null);
        setPromotion(null);
        setActionError("");
        setUndoNotice("");
        break;
      case "sync":
        applySync(msg.sync, syncSetters);
        setSelected(null);
        setPromotion(null);
        setActionError("");
        if (!msg.sync.pendingUndoFrom) setUndoNotice("");
        break;
      case "undoDeclined":
        setUndoNotice("对手拒绝了悔棋申请");
        break;
      case "error":
        if (screenRef.current === "game") {
          setActionError(msg.message);
          if (
            msg.message.includes("加子") ||
            msg.message.includes("兵种") ||
            msg.message.includes("落子")
          ) {
            setAwaitingWhitePickKind(false);
            setPendingAddKind(null);
          }
        } else setLobbyError(msg.message);
        break;
      default:
        break;
    }
  }, [syncSetters]);

  const connectWs = useCallback(
    (onOpenSend: ClientMessage) => {
      wsRef.current?.close();
      setLobbyError("");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify(onOpenSend));
      ws.onmessage = (ev) => {
        try {
          handleServerMessage(JSON.parse(String(ev.data)) as ServerMessage);
        } catch {
          setLobbyError("服务器消息解析失败");
        }
      };
      ws.onerror = () => setLobbyError("无法连接联机服务器");
      ws.onclose = () => setConnected(false);
    },
    [handleServerMessage],
  );

  const createRoom = useCallback(() => {
    connectWs({ type: "createRoom" });
  }, [connectWs]);

  const joinRoom = useCallback(() => {
    const id = joinInput.trim();
    if (!id) {
      setLobbyError("请输入房间号");
      return;
    }
    connectWs({ type: "joinRoom", roomId: id });
  }, [connectWs, joinInput]);

  const startGame = useCallback(() => {
    send({ type: "startGame" });
  }, [send]);

  const leave = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setScreen("lobby");
    setRoomId("");
    setSeat(null);
    setPlayerCount(0);
    setVariant(null);
    setJoinInput("");
    setLobbyError("");
    setActionError("");
    setConnected(false);
    setAwaitingWhitePickKind(false);
    setPendingAddKind(null);
    setPendingUndoFrom(null);
    setOpponentLeft(false);
    setUndoNotice("");
  }, []);

  const leaveWithConfirm = useCallback(() => {
    if (screen === "game") {
      if (!window.confirm("确定离开房间？当前对局将中断，对手会收到提示。")) {
        return;
      }
    } else if (connected && roomId) {
      if (!window.confirm("确定离开房间？")) {
        return;
      }
    }
    leave();
  }, [screen, connected, roomId, leave]);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const status: GameStatus = useMemo(
    () =>
      variant
        ? getVariantStatus(variant)
        : { kind: "playing", inCheck: false },
    [variant],
  );

  const terminal = useMemo(
    () => (variant ? isVariantTerminal(variant) : false),
    [variant],
  );

  const blackStep: BlackStep = useMemo(() => {
    if (awaitingWhitePickKind) {
      return seat === "white" ? "add_white_pick_kind" : "pick_action";
    }
    if (pendingAddKind) {
      return seat === "black" ? "add_square" : "pick_action";
    }
    return localBlackStep;
  }, [
    awaitingWhitePickKind,
    pendingAddKind,
    seat,
    localBlackStep,
  ]);

  const addKind = pendingAddKind;

  useEffect(() => {
    setLocalBlackStep("pick_action");
    setSelected(null);
  }, [variant?.sideToMove, variant?.phase, awaitingWhitePickKind, pendingAddKind]);

  const isMyTurn = useCallback((): boolean => {
    if (!variant || !seat || terminal) return false;
    if (variant.phase === "place_black_king") return seat === "black";
    if (awaitingWhitePickKind) return seat === "white";
    if (pendingAddKind) return seat === "black";
    return variant.sideToMove === seat;
  }, [variant, seat, terminal, awaitingWhitePickKind, pendingAddKind]);

  const inCheckBlack = useMemo(
    () =>
      variant?.phase === "play" ? inCheck(variant.board, "black") : false,
    [variant],
  );

  const teleportUnlocked = useMemo(
    () => (variant ? teleportCategoryUnlocked(variant.reserve) : false),
    [variant],
  );

  const whiteLegalKinds = useMemo(
    () => (variant ? whiteLegalPieceKinds(variant) : []),
    [variant],
  );

  const canAdd = useMemo(
    () => (variant ? blackHasLegalAdd(variant) : false),
    [variant],
  );

  const canTeleportBtn = useMemo(
    () =>
      variant
        ? variant.phase === "play" &&
          variant.sideToMove === "black" &&
          !variant.blackTeleportUsed &&
          teleportCategoryUnlocked(variant.reserve) &&
          blackHasLegalTeleport(variant)
        : false,
    [variant],
  );

  const canMoveBlack = useMemo(
    () => (variant ? legalBlackBoardMoves(variant).length > 0 : false),
    [variant],
  );

  const squareDecoration = useCallback(
    (sq: Square): "none" | "sel" | "ok" | "bad" => {
      if (!variant) return "none";
      if (selected && selected.file === sq.file && selected.rank === sq.rank) {
        return "sel";
      }

      if (variant.phase === "place_black_king") {
        const { legal, blocked } = blackKingSetupHighlights(variant);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      if (variant.phase !== "play" || terminal) return "none";

      if (
        variant.sideToMove === "white" &&
        selected &&
        pieceAt(variant.board, selected)?.side === "white"
      ) {
        const { legal, blocked } = whiteHighlightSquares(variant, selected);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      if (
        variant.sideToMove === "black" &&
        blackStep === "moving" &&
        selected &&
        pieceAt(variant.board, selected)?.side === "black"
      ) {
        const { legal, blocked } = blackHighlightSquares(variant, selected);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      if (blackStep === "add_square" && addKind) {
        const { legal, blocked } = blackAddHighlights(variant, addKind);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      if (blackStep === "teleport") {
        const { legal, blocked } = teleportHighlights(variant);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      return "none";
    },
    [variant, terminal, selected, blackStep, addKind],
  );

  const trySendMove = useCallback(
    (from: Square, to: Square, promo?: PieceKind) => {
      if (!variant) return false;
      const lm =
        variant.sideToMove === "white"
          ? legalWhiteMoves(variant)
          : legalBlackBoardMoves(variant);
      const cand = movesMatching(lm, from, to);
      if (cand.length === 0) return false;
      const pick =
        promo !== undefined
          ? cand.find((m) => m.promotion === promo)
          : cand.length === 1
            ? cand[0]
            : undefined;
      if (!pick) {
        if (cand.length > 1 && promo === undefined) {
          setPromotion({ mode: "move", from, to });
        }
        return false;
      }
      send({ type: "move", from, to, promotion: pick.promotion });
      setSelected(null);
      setPromotion(null);
      return true;
    },
    [variant, send],
  );

  const onSquareClick = useCallback(
    (sq: Square) => {
      if (!variant || terminal || promotion || !isMyTurn()) return;

      if (variant.phase === "place_black_king") {
        if (seat !== "black") return;
        send({ type: "placeKing", to: sq });
        return;
      }

      if (variant.sideToMove === "white" && seat === "white") {
        const lm = legalWhiteMoves(variant);
        const pc = pieceAt(variant.board, sq);
        if (selected) {
          if (sameSq(selected, sq)) {
            setSelected(null);
            return;
          }
          if (
            pieceAt(variant.board, selected)?.side === "white" &&
            movesMatching(lm, selected, sq).length > 0
          ) {
            trySendMove(selected, sq);
            return;
          }
        }
        if (pc?.side === "white") {
          setSelected(sq);
          return;
        }
        setSelected(null);
        return;
      }

      if (seat !== "black" || variant.sideToMove !== "black") return;

      if (blackStep === "pick_action") return;

      if (blackStep === "moving") {
        const lm = legalBlackBoardMoves(variant);
        const pc = pieceAt(variant.board, sq);
        if (selected) {
          if (sameSq(selected, sq)) {
            setSelected(null);
            return;
          }
          if (
            pieceAt(variant.board, selected)?.side === "black" &&
            movesMatching(lm, selected, sq).length > 0
          ) {
            trySendMove(selected, sq);
            return;
          }
        }
        if (pc?.side === "black") {
          setSelected(sq);
          return;
        }
        setSelected(null);
        return;
      }

      if (blackStep === "add_square" && addKind) {
        if (!pieceAt(variant.board, sq)) {
          if (addKind === "pawn" && sq.rank === 7) {
            setPromotion({ mode: "add", kind: addKind, to: sq });
            return;
          }
          send({ type: "addPiece", to: sq });
          setLocalBlackStep("pick_action");
        }
        return;
      }

      if (blackStep === "teleport") {
        const legal = legalTeleportSquares(variant);
        if (legal.some((s) => sameSq(s, sq))) {
          send({ type: "teleport", to: sq });
          setLocalBlackStep("pick_action");
        }
      }
    },
    [
      variant,
      terminal,
      promotion,
      isMyTurn,
      seat,
      selected,
      blackStep,
      addKind,
      send,
      trySendMove,
    ],
  );

  const choosePromotion = useCallback(
    (kind: Exclude<PieceKind, "pawn" | "king">) => {
      if (!promotion) return;
      if (promotion.mode === "move") {
        trySendMove(promotion.from, promotion.to, kind);
      } else {
        send({
          type: "addPiece",
          to: promotion.to,
          promotion: kind,
        });
        setPromotion(null);
        setLocalBlackStep("pick_action");
      }
    },
    [promotion, trySendMove, send],
  );

  const cancelPromotion = useCallback(() => setPromotion(null), []);

  const startBlackMove = useCallback(() => {
    if (!isMyTurn()) return;
    setLocalBlackStep("moving");
    setSelected(null);
  }, [isMyTurn]);

  const startBlackAdd = useCallback(() => {
    if (!isMyTurn()) return;
    setAwaitingWhitePickKind(true);
    setPendingAddKind(null);
    send({ type: "beginAdd" });
  }, [isMyTurn, send]);

  const requestUndo = useCallback(() => {
    send({ type: "requestUndo" });
    setUndoNotice("已发送悔棋申请，等待对手回应…");
  }, [send]);

  const respondUndo = useCallback(
    (accept: boolean) => {
      send({ type: "respondUndo", accept });
      if (accept) setUndoNotice("");
    },
    [send],
  );

  const startTeleport = useCallback(() => {
    if (!isMyTurn()) return;
    setLocalBlackStep("teleport");
    setSelected(null);
  }, [isMyTurn]);

  const whitePickPieceKind = useCallback(
    (kind: PieceKind) => {
      if (seat !== "white" || !awaitingWhitePickKind) return;
      send({ type: "pickAddKind", kind });
    },
    [seat, awaitingWhitePickKind, send],
  );

  const cancelBlackFlow = useCallback(() => {
    send({ type: "cancelAdd" });
    setAwaitingWhitePickKind(false);
    setPendingAddKind(null);
    setLocalBlackStep("pick_action");
    setSelected(null);
  }, [send]);

  const showWhitePickPanel =
    Boolean(variant && seat === "white" && awaitingWhitePickKind);

  const canRequestUndo = Boolean(
    variant &&
      seat &&
      !terminal &&
      !awaitingWhitePickKind &&
      !pendingAddKind &&
      !pendingUndoFrom &&
      variant.sideToMove !== seat,
  );

  const canRespondUndo = Boolean(
    variant &&
      seat &&
      pendingUndoFrom &&
      pendingUndoFrom !== seat &&
      variant.sideToMove === seat,
  );

  const gameController =
    variant && seat && screen === "game"
      ? {
          variant,
          status,
          terminal,
          selected,
          blackStep,
          addKind,
          promotion,
          squareDecoration,
          onSquareClick,
          reset: leaveWithConfirm,
          undo: requestUndo,
          canUndo: canRequestUndo,
          canRespondUndo,
          respondUndo,
          pendingUndoFrom,
          whiteLegalKinds,
          canAdd,
          canTeleportBtn,
          canMoveBlack,
          inCheckBlack,
          teleportUnlocked,
          startBlackMove,
          startBlackAdd,
          startTeleport,
          whitePickPieceKind,
          cancelBlackFlow,
          choosePromotion,
          cancelPromotion,
          seat,
          isMyTurn: isMyTurn(),
          actionError,
          awaitingWhitePickKind,
          showWhitePickPanel,
        }
      : null;

  return {
    screen,
    roomId,
    seat,
    playerCount,
    lobbyError,
    joinInput,
    setJoinInput,
    connected,
    createRoom,
    joinRoom,
    startGame,
    leave: leaveWithConfirm,
    leaveForce: leave,
    opponentLeft,
    undoNotice,
    setUndoNotice,
    gameController,
    wsUrl: WS_URL,
  };
}

export type VariantGameController = NonNullable<
  ReturnType<typeof useMultiplayer>["gameController"]
>;
