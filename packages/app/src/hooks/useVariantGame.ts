import { useCallback, useEffect, useMemo, useState } from "react";
import type { VariantSnapshot } from "@addchess/core";
import {
  applyBlackAdd,
  applyBlackTeleport,
  applyNormalMove,
  applyPlaceBlackKing,
  blackAddHighlights,
  blackHasLegalAdd,
  blackHasLegalTeleport,
  blackHighlightSquares,
  blackKingSetupHighlights,
  createVariantInitial,
  getVariantStatus,
  inCheck,
  isVariantTerminal,
  legalBlackBoardMoves,
  legalTeleportSquares,
  legalWhiteMoves,
  pieceAt,
  teleportCategoryUnlocked,
  teleportHighlights,
  whiteHighlightSquares,
  whiteLegalPieceKinds,
  type GameStatus,
  type Move,
  type PieceKind,
  type Square,
} from "@addchess/core";

export type BlackStep =
  | "pick_action"
  | "moving"
  | "add_white_pick_kind"
  | "add_square"
  | "teleport";

export type PromotionPending =
  | { mode: "move"; from: Square; to: Square }
  | {
      mode: "add";
      kind: PieceKind;
      to: Square;
    };

function sameSq(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

function movesMatching(moves: Move[], from: Square, to: Square): Move[] {
  return moves.filter(
    (m) => sameSq(m.from, from) && sameSq(m.to, to),
  );
}

export function useVariantGame() {
  const [variant, setVariant] = useState<VariantSnapshot>(createVariantInitial);
  const [selected, setSelected] = useState<Square | null>(null);
  const [blackStep, setBlackStep] = useState<BlackStep>("pick_action");
  const [addKind, setAddKind] = useState<PieceKind | null>(null);
  const [promotion, setPromotion] = useState<PromotionPending | null>(null);

  const status: GameStatus = useMemo(
    () => getVariantStatus(variant),
    [variant],
  );
  const terminal = useMemo(() => isVariantTerminal(variant), [variant]);
  const inCheckBlack = useMemo(
    () => variant.phase === "play" && inCheck(variant.board, "black"),
    [variant],
  );

  const teleportUnlocked = useMemo(
    () => teleportCategoryUnlocked(variant.reserve),
    [variant.reserve],
  );

  useEffect(() => {
    setBlackStep("pick_action");
    setAddKind(null);
    setSelected(null);
  }, [variant.sideToMove, variant.phase]);

  const reset = useCallback(() => {
    setVariant(createVariantInitial());
    setSelected(null);
    setBlackStep("pick_action");
    setAddKind(null);
    setPromotion(null);
  }, []);

  const whiteLegalKinds = useMemo(
    () => whiteLegalPieceKinds(variant),
    [variant],
  );

  const canAdd = useMemo(
    () => blackHasLegalAdd(variant),
    [variant],
  );

  const canTeleportBtn = useMemo(
    () =>
      variant.phase === "play" &&
      variant.sideToMove === "black" &&
      !variant.blackTeleportUsed &&
      teleportCategoryUnlocked(variant.reserve) &&
      blackHasLegalTeleport(variant),
    [variant],
  );

  const canMoveBlack = useMemo(
    () => legalBlackBoardMoves(variant).length > 0,
    [variant],
  );

  const squareDecoration = useCallback(
    (sq: Square): "none" | "sel" | "ok" | "bad" => {
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

      if (
        variant.sideToMove === "black" &&
        blackStep === "add_square" &&
        addKind
      ) {
        const { legal, blocked } = blackAddHighlights(variant, addKind);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      if (variant.sideToMove === "black" && blackStep === "teleport") {
        const { legal, blocked } = teleportHighlights(variant);
        if (legal.some((s) => sameSq(s, sq))) return "ok";
        if (blocked.some((s) => sameSq(s, sq))) return "bad";
        return "none";
      }

      return "none";
    },
    [
      variant,
      terminal,
      selected,
      blackStep,
      addKind,
    ],
  );

  const tryApplyMove = useCallback(
    (from: Square, to: Square, promo?: PieceKind) => {
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
      const next = applyNormalMove(variant, pick);
      if (!next) return false;
      setVariant(next);
      setSelected(null);
      setPromotion(null);
      return true;
    },
    [variant],
  );

  const onSquareClick = useCallback(
    (sq: Square) => {
      if (terminal) return;
      if (promotion) return;

      if (variant.phase === "place_black_king") {
        const next = applyPlaceBlackKing(variant, sq);
        if (next) setVariant(next);
        return;
      }

      if (variant.sideToMove === "white") {
        const lm = legalWhiteMoves(variant);
        const pc = pieceAt(variant.board, sq);
        if (selected) {
          if (sameSq(selected, sq)) {
            setSelected(null);
            return;
          }
          const moving = pieceAt(variant.board, selected);
          if (
            moving?.side === "white" &&
            movesMatching(lm, selected, sq).length > 0
          ) {
            tryApplyMove(selected, sq);
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

      if (blackStep === "pick_action") {
        return;
      }

      if (blackStep === "moving") {
        const lm = legalBlackBoardMoves(variant);
        const pc = pieceAt(variant.board, sq);
        if (selected) {
          if (sameSq(selected, sq)) {
            setSelected(null);
            return;
          }
          const moving = pieceAt(variant.board, selected);
          if (
            moving?.side === "black" &&
            movesMatching(lm, selected, sq).length > 0
          ) {
            tryApplyMove(selected, sq);
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
            setPromotion({
              mode: "add",
              kind: addKind,
              to: sq,
            });
            return;
          }
          const next = applyBlackAdd(variant, addKind, sq);
          if (next) {
            setVariant(next);
            setBlackStep("pick_action");
            setAddKind(null);
            setSelected(null);
          }
        }
        return;
      }

      if (blackStep === "teleport") {
        const legal = legalTeleportSquares(variant);
        if (legal.some((s) => sameSq(s, sq))) {
          const next = applyBlackTeleport(variant, sq);
          if (next) {
            setVariant(next);
            setBlackStep("pick_action");
            setSelected(null);
          }
        }
      }
    },
    [
      variant,
      terminal,
      promotion,
      blackStep,
      addKind,
      selected,
      tryApplyMove,
    ],
  );

  const choosePromotion = useCallback(
    (kind: Exclude<PieceKind, "pawn" | "king">) => {
      if (!promotion) return;
      if (promotion.mode === "move") {
        tryApplyMove(promotion.from, promotion.to, kind);
      } else {
        const next = applyBlackAdd(
          variant,
          promotion.kind,
          promotion.to,
          kind,
        );
        if (next) {
          setVariant(next);
          setPromotion(null);
          setBlackStep("pick_action");
          setAddKind(null);
        }
      }
    },
    [promotion, variant, tryApplyMove],
  );

  const cancelPromotion = useCallback(() => setPromotion(null), []);

  const startBlackMove = useCallback(() => {
    setBlackStep("moving");
    setSelected(null);
  }, []);

  const startBlackAdd = useCallback(() => {
    setBlackStep("add_white_pick_kind");
    setAddKind(null);
    setSelected(null);
  }, []);

  const startTeleport = useCallback(() => {
    setBlackStep("teleport");
    setSelected(null);
  }, []);

  const whitePickPieceKind = useCallback((kind: PieceKind) => {
    setAddKind(kind);
    setBlackStep("add_square");
  }, []);

  const cancelBlackFlow = useCallback(() => {
    setBlackStep("pick_action");
    setAddKind(null);
    setSelected(null);
  }, []);

  return {
    variant,
    status,
    terminal,
    selected,
    blackStep,
    addKind,
    promotion,
    squareDecoration,
    onSquareClick,
    reset,
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
  };
}
