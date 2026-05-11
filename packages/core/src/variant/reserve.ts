import type { BlackReserve } from "./types.js";

export function fullBlackReserve(): BlackReserve {
  return {
    pawn: 8,
    knight: 2,
    bishop: 2,
    rook: 2,
    queen: 1,
  };
}

/** 备战区三类都还有棋（用于连将限制触发）。 */
export function threeCategoriesInReserve(r: BlackReserve): boolean {
  const lightLeft = r.knight > 0 || r.bishop > 0;
  const heavyLeft = r.rook > 0 || r.queen > 0;
  return r.pawn > 0 && lightLeft && heavyLeft;
}

/** 任一类别已加空 → 解锁空降（整盘一次，另由 blackTeleportUsed 限制）。 */
export function teleportCategoryUnlocked(r: BlackReserve): boolean {
  const lightEmpty = r.knight === 0 && r.bishop === 0;
  const heavyEmpty = r.rook === 0 && r.queen === 0;
  return r.pawn === 0 || lightEmpty || heavyEmpty;
}
