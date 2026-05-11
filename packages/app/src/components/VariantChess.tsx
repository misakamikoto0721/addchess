import type { GameStatus, PieceKind } from "@addchess/core";
import { pieceAt, squareKey, type BlackReserve, type Piece, type Square } from "@addchess/core";
import { useVariantGame } from "../hooks/useVariantGame.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const WHITE_ADD_KIND_ORDER: PieceKind[] = [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
];

const UNICODE: Record<Piece["kind"], { white: string; black: string }> = {
  king: { white: "\u2654", black: "\u265a" },
  queen: { white: "\u2655", black: "\u265b" },
  rook: { white: "\u2656", black: "\u265c" },
  bishop: { white: "\u2657", black: "\u265d" },
  knight: { white: "\u2658", black: "\u265e" },
  pawn: { white: "\u2659", black: "\u265f" },
};

function pieceGlyph(p: Piece): string {
  return UNICODE[p.kind][p.side];
}

function statusText(s: GameStatus): string {
  switch (s.kind) {
    case "playing":
      return s.inCheck ? "将军" : "";
    case "checkmate":
      return s.winner === "white" ? "将杀 · 白方胜" : "将杀 · 黑方胜";
    case "stalemate":
      return "困毙 · 和棋";
    case "draw":
      return s.reason === "fifty-move"
        ? "和棋（50 回合）"
        : "和棋（子力不足）";
    default:
      return "";
  }
}

function ReservePanel({
  reserve,
  teleportUsed,
  teleportUnlocked,
}: {
  reserve: BlackReserve;
  teleportUsed: boolean;
  teleportUnlocked: boolean;
}) {
  return (
    <div className="reserve-panel">
      <h3 className="reserve-title">黑方备战区</h3>
      <div className="reserve-row reserve-row-pawns">
        <span className="reserve-label">兵</span>
        <span className="reserve-count">{reserve.pawn}</span>
      </div>
      <div className="reserve-row reserve-row-light">
        <span className="reserve-label">轻子</span>
        <span className="reserve-item">
          马 <strong>{reserve.knight}</strong>
        </span>
        <span className="reserve-item">
          象 <strong>{reserve.bishop}</strong>
        </span>
      </div>
      <div className="reserve-row reserve-row-heavy">
        <span className="reserve-label">重子</span>
        <span className="reserve-item">
          车 <strong>{reserve.rook}</strong>
        </span>
        <span className="reserve-item">
          后 <strong>{reserve.queen}</strong>
        </span>
      </div>
      <p className="reserve-hint">
        空降：{teleportUnlocked ? "已解锁" : "未解锁（需某一类先加完）"}
        {teleportUsed ? " · 本局已用过空降" : ""}
      </p>
    </div>
  );
}

function pieceKindsLabel(k: PieceKind): string {
  if (k === "pawn") return "兵";
  if (k === "knight") return "马";
  if (k === "bishop") return "象";
  if (k === "rook") return "车";
  if (k === "queen") return "后";
  return "王";
}

export function VariantChess() {
  const {
    variant,
    status,
    terminal,
    blackStep,
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
  } = useVariantGame();

  const sideLabel =
    variant.phase === "place_black_king"
      ? "黑方"
      : variant.sideToMove === "white"
        ? "白方"
        : "黑方";
  const extra = statusText(status);

  return (
    <div className="variant-layout">
      <aside className="variant-sidebar">
        <ReservePanel
          reserve={variant.reserve}
          teleportUsed={variant.blackTeleportUsed}
          teleportUnlocked={teleportUnlocked}
        />

        {variant.phase === "play" &&
        variant.sideToMove === "black" &&
        !terminal ? (
          <div className="action-panel">
            <h3 className="action-title">黑方本回合</h3>
            {blackStep === "pick_action" ? (
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-action"
                  disabled={!canMoveBlack}
                  onClick={startBlackMove}
                >
                  走棋
                </button>
                <button
                  type="button"
                  className="btn-action"
                  disabled={inCheckBlack || !canAdd}
                  title={
                    inCheckBlack
                      ? "被将军时不能加子"
                      : !canAdd
                        ? "无法加子"
                        : undefined
                  }
                  onClick={startBlackAdd}
                >
                  加棋
                </button>
                <button
                  type="button"
                  className="btn-action"
                  disabled={!canTeleportBtn}
                  title={
                    !teleportUnlocked
                      ? "需某一类备战棋子先加完"
                      : !canTeleportBtn
                        ? "无可达空格或未解锁"
                        : undefined
                  }
                  onClick={startTeleport}
                >
                  空降王
                </button>
              </div>
            ) : (
              <div className="flow-banner">
                <span>
                  {blackStep === "moving"
                    ? "请在棋盘上走子（绿=可走，红=造型可到但被规则禁）"
                    : blackStep === "add_white_pick_kind"
                      ? "请白方点选要加入的兵种"
                      : blackStep === "add_square"
                        ? "请黑方点选空格落子（绿=可放，红=不可放）"
                        : "空降：绿=安全格，红=空但会被将军"}
                </span>
                <button
                  type="button"
                  className="btn-muted small"
                  onClick={cancelBlackFlow}
                >
                  取消
                </button>
              </div>
            )}

            {blackStep === "add_white_pick_kind" ? (
              <div className="white-pick-kinds">
                <p className="panel-sub">白方指定兵种（灰=库存不足或连续限制）</p>
                <div className="kind-buttons">
                  {WHITE_ADD_KIND_ORDER.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="btn-kind"
                      disabled={!whiteLegalKinds.includes(k)}
                      title={
                        !whiteLegalKinds.includes(k)
                          ? "备战区无此子或白方连续加子限制不允许"
                          : undefined
                      }
                      onClick={() => whitePickPieceKind(k)}
                    >
                      {pieceKindsLabel(k)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>

      <div className="variant-main">
        <div className="board-toolbar">
          <span className="board-meta">
            {variant.phase === "place_black_king" ? (
              <strong>
                请黑方放置黑王：浅绿=可落子，红底=王在该格会被将军
              </strong>
            ) : terminal ? (
              <strong>{extra || "对局结束"}</strong>
            ) : (
              <>
                行棋方：<strong>{sideLabel}</strong>
                {extra ? <span className="board-check"> · {extra}</span> : null}
              </>
            )}
          </span>
          <button type="button" className="btn-reset" onClick={reset}>
            新对局
          </button>
        </div>

        <section className="board-wrap board-wrap-variant" aria-label="棋盘">
          <div className="board-grid" role="grid">
            {Array.from({ length: 8 }, (_, rank) =>
              Array.from({ length: 8 }, (_, file) => {
                const sq: Square = { file, rank };
                const light = (file + rank) % 2 === 0;
                const piece = pieceAt(variant.board, sq);
                const dec = squareDecoration(sq);
                const cls = [
                  "cell",
                  light ? "cell-light" : "cell-dark",
                  dec === "sel" ? "cell-selected" : "",
                  dec === "ok" ? "cell-legal" : "",
                  dec === "bad" ? "cell-blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={squareKey(sq)}
                    type="button"
                    className={cls}
                    data-file={FILES[file]}
                    data-rank={8 - rank}
                    aria-label={`${FILES[file]}${8 - rank}`}
                    onClick={() => onSquareClick(sq)}
                  >
                    {piece ? (
                      <span
                        className={`piece ${piece.side === "white" ? "piece-white" : "piece-black"}`}
                        aria-hidden
                      >
                        {pieceGlyph(piece)}
                      </span>
                    ) : null}
                  </button>
                );
              }),
            ).flat()}
          </div>
        </section>

        {promotion ? (
          <div className="promotion-overlay" role="dialog" aria-label="升变">
            <div className="promotion-card">
              <p>升变为</p>
              <div className="promotion-row">
                {(
                  ["queen", "rook", "bishop", "knight"] as const
                ).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className="promotion-btn"
                    onClick={() => choosePromotion(kind)}
                  >
                    {pieceKindsLabel(kind)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-muted"
                onClick={cancelPromotion}
              >
                取消
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
