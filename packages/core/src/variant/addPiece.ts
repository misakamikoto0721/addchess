import { inCheck } from "../chess/attacks.js";
import { cloneBoard, pieceAt, squareKey } from "../model/Board.js";
import type { PieceKind } from "../model/types.js";
import { applyStreakPick, wouldViolateWhiteStreak } from "./streak.js";
import type { AddCategory, VariantSnapshot } from "./types.js";

/** 用于白方连选计数：兵 / 轻子 / 重子。 */
export function addCategoryForKind(kind: PieceKind): AddCategory {
  if (kind === "pawn") return "pawn";
  if (kind === "knight" || kind === "bishop") return "light";
  return "heavy";
}

/** 备战区里「类别」仍有种棋可加的集合（兵 / 轻子 / 重子）。 */
export function reserveCategoriesWithStock(v: VariantSnapshot): AddCategory[] {
  const out: AddCategory[] = [];
  if (v.reserve.pawn > 0) out.push("pawn");
  if (v.reserve.knight > 0 || v.reserve.bishop > 0) out.push("light");
  if (v.reserve.rook > 0 || v.reserve.queen > 0) out.push("heavy");
  return out;
}

/** 连续指定限制仅在「至少两类仍有库存」时生效，否则白方只能反复指定剩下一类，不得封死加子。 */
function streakWouldBlock(v: VariantSnapshot, cat: AddCategory): boolean {
  if (reserveCategoriesWithStock(v).length < 2) return false;
  return wouldViolateWhiteStreak(v.whiteAddStreak, cat);
}

export function kindsAvailableInCategory(
  v: VariantSnapshot,
  cat: AddCategory,
): PieceKind[] {
  switch (cat) {
    case "pawn":
      return v.reserve.pawn > 0 ? ["pawn"] : [];
    case "light":
      return [
        ...(v.reserve.knight > 0 ? (["knight"] as const) : []),
        ...(v.reserve.bishop > 0 ? (["bishop"] as const) : []),
      ];
    case "heavy":
      return [
        ...(v.reserve.rook > 0 ? (["rook"] as const) : []),
        ...(v.reserve.queen > 0 ? (["queen"] as const) : []),
      ];
    default:
      return [];
  }
}

export function whiteLegalAddCategories(v: VariantSnapshot): AddCategory[] {
  const out: AddCategory[] = [];
  if (v.reserve.pawn > 0 && !streakWouldBlock(v, "pawn")) {
    out.push("pawn");
  }
  const lightAvail = v.reserve.knight > 0 || v.reserve.bishop > 0;
  if (lightAvail && !streakWouldBlock(v, "light")) {
    out.push("light");
  }
  const heavyAvail = v.reserve.rook > 0 || v.reserve.queen > 0;
  if (heavyAvail && !streakWouldBlock(v, "heavy")) {
    out.push("heavy");
  }
  return out;
}

/** 白方可指定的具体兵种（库存够且不计数违规）。 */
export function whiteLegalPieceKinds(v: VariantSnapshot): PieceKind[] {
  const out: PieceKind[] = [];
  if (v.reserve.pawn > 0 && !streakWouldBlock(v, "pawn")) {
    out.push("pawn");
  }
  if (v.reserve.knight > 0 && !streakWouldBlock(v, "light")) {
    out.push("knight");
  }
  if (v.reserve.bishop > 0 && !streakWouldBlock(v, "light")) {
    out.push("bishop");
  }
  if (v.reserve.rook > 0 && !streakWouldBlock(v, "heavy")) {
    out.push("rook");
  }
  if (v.reserve.queen > 0 && !streakWouldBlock(v, "heavy")) {
    out.push("queen");
  }
  return out;
}

function decReserve(
  r: VariantSnapshot["reserve"],
  kind: PieceKind,
): VariantSnapshot["reserve"] | null {
  const n = { ...r };
  switch (kind) {
    case "pawn":
      if (n.pawn <= 0) return null;
      n.pawn--;
      break;
    case "knight":
      if (n.knight <= 0) return null;
      n.knight--;
      break;
    case "bishop":
      if (n.bishop <= 0) return null;
      n.bishop--;
      break;
    case "rook":
      if (n.rook <= 0) return null;
      n.rook--;
      break;
    case "queen":
      if (n.queen <= 0) return null;
      n.queen--;
      break;
    default:
      return null;
  }
  return n;
}

/** 黑方加子：白方已选定兵种 `kind`，黑方仅选空格 `to`。 */
export function applyBlackAdd(
  v: VariantSnapshot,
  kind: PieceKind,
  to: { file: number; rank: number },
  promotion?: PieceKind,
): VariantSnapshot | null {
  if (v.phase !== "play" || v.sideToMove !== "black") return null;
  if (inCheck(v.board, "black")) return null;
  if (pieceAt(v.board, to)) return null;

  if (kind === "king") return null;
  if (!whiteLegalPieceKinds(v).includes(kind)) return null;

  const cat = addCategoryForKind(kind);

  const reserve = decReserve(v.reserve, kind);
  if (!reserve) return null;

  let placedKind: PieceKind = kind;
  if (kind === "pawn" && to.rank === 7) {
    if (
      !promotion ||
      promotion === "king" ||
      promotion === "pawn"
    ) {
      return null;
    }
    placedKind = promotion;
  }

  const board = cloneBoard(v.board);
  const ids = new Map(v.pieceIds);
  const k = squareKey(to);
  board.set(k, { kind: placedKind, side: "black" });
  ids.set(k, `b${v.nextPieceId}`);

  const whiteAddStreak = applyStreakPick(v.whiteAddStreak, cat);

  return {
    ...v,
    board,
    pieceIds: ids,
    nextPieceId: v.nextPieceId + 1,
    reserve,
    whiteAddStreak,
    sideToMove: "white",
  };
}
