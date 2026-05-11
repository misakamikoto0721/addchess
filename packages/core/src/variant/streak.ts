import type { AddCategory, WhiteAddStreak } from "./types.js";

export function applyStreakPick(
  streak: WhiteAddStreak,
  cat: AddCategory,
): WhiteAddStreak {
  return {
    pawn: cat === "pawn" ? streak.pawn + 1 : 0,
    light: cat === "light" ? streak.light + 1 : 0,
    heavy: cat === "heavy" ? streak.heavy + 1 : 0,
  };
}

export function wouldViolateWhiteStreak(
  streak: WhiteAddStreak,
  cat: AddCategory,
): boolean {
  const n = applyStreakPick(streak, cat);
  return n.pawn >= 3 || n.light >= 3 || n.heavy >= 2;
}
