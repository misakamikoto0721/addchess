import { Suspense, lazy } from "react";
import { useMultiplayer } from "../hooks/useMultiplayer.js";
import type { PieceKind } from "@addchess/core";

const VariantChess = lazy(() =>
  import("./VariantChess.js").then((m) => ({
    default: m.VariantChess,
  })),
);

const WHITE_ADD_KIND_ORDER: PieceKind[] = [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
];

function pieceKindsLabel(k: PieceKind): string {
  if (k === "pawn") return "兵";
  if (k === "knight") return "马";
  if (k === "bishop") return "象";
  if (k === "rook") return "车";
  if (k === "queen") return "后";
  return "王";
}

export function MultiplayerPanel() {
  const mp = useMultiplayer();
  const isLocalDev =
    mp.wsUrl.includes("localhost") || mp.wsUrl.includes("127.0.0.1");

  if (mp.screen === "game" && mp.gameController) {
    const g = mp.gameController;
    return (
      <div className="multiplayer-game">
        <div className="online-banner">
          <span>
            房间 <strong>{mp.roomId}</strong> · 你是
            <strong>{mp.seat === "white" ? "白方" : "黑方"}</strong>
            {g.isMyTurn ? (
              <span className="online-your-turn"> · 轮到你</span>
            ) : (
              <span> · 等待对手</span>
            )}
          </span>
          <button type="button" className="btn-muted small" onClick={mp.leave}>
            离开房间
          </button>
        </div>

        {mp.undoNotice ? (
          <p className="online-notice" role="status">
            {mp.undoNotice}
          </p>
        ) : null}

        {g.actionError ? (
          <p className="online-error" role="alert">
            {g.actionError}
          </p>
        ) : null}

        {g.canRespondUndo ? (
          <div className="undo-request-bar" role="alert">
            <span>
              对手申请悔棋（撤销上一步），是否同意？
            </span>
            <div className="undo-request-actions">
              <button
                type="button"
                className="btn-reset"
                onClick={() => g.respondUndo(true)}
              >
                同意
              </button>
              <button
                type="button"
                className="btn-muted"
                onClick={() => g.respondUndo(false)}
              >
                拒绝
              </button>
            </div>
          </div>
        ) : null}

        <Suspense fallback={<p className="load-notice">加载棋盘…</p>}>
          <VariantChess game={g} online />
        </Suspense>

        {g.showWhitePickPanel ? (
          <div className="white-pick-overlay" role="dialog" aria-label="白方指定加子兵种">
            <div className="white-pick-modal">
              <h3>白方请指定加子兵种</h3>
              <p className="panel-sub">黑方已发起加子，请选择要加入的棋子类型</p>
              <div className="kind-buttons">
                {WHITE_ADD_KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="btn-kind"
                    disabled={!g.whiteLegalKinds.includes(k)}
                    onClick={() => g.whitePickPieceKind(k)}
                  >
                    {pieceKindsLabel(k)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="lobby-panel">
      <h2 className="lobby-title">联机大厅</h2>

      {mp.opponentLeft ? (
        <p className="online-notice" role="alert">
          对手已离开房间。你可以继续等待新对手加入，或离开房间。
        </p>
      ) : null}

      <p className="lobby-hint">
        {isLocalDev ? (
          <>
            联机服务器：<code>{mp.wsUrl}</code>
            <br />
            请先在本机另开终端运行 <code>npm run dev:server</code>
            ，再用两个浏览器窗口测试。
          </>
        ) : (
          <>创建或加入房间；两人到齐后各自选边并点准备，双方准备后自动开始。</>
        )}
      </p>

      <div className="lobby-actions">
        <button type="button" className="btn-action" onClick={mp.createRoom}>
          创建房间
        </button>
      </div>

      {mp.connected && mp.roomId ? (
        <div className="lobby-room card">
          <p>
            房间号：<strong className="room-id">{mp.roomId}</strong>
          </p>
          <p>
            已连接：<strong>{mp.playerCount}</strong> / 2 人
          </p>

          <div className="seat-pick">
            <p className="seat-pick-label">选择你的阵营</p>
            <div className="seat-pick-buttons" role="group" aria-label="选择阵营">
              <button
                type="button"
                className={
                  mp.mySeatChoice === "white"
                    ? "btn-seat active"
                    : "btn-seat"
                }
                disabled={mp.opponentSeatChoice === "white"}
                onClick={() => mp.chooseSeat("white")}
              >
                白方
              </button>
              <button
                type="button"
                className={
                  mp.mySeatChoice === "black"
                    ? "btn-seat active"
                    : "btn-seat"
                }
                disabled={mp.opponentSeatChoice === "black"}
                onClick={() => mp.chooseSeat("black")}
              >
                黑方
              </button>
            </div>
            <p className="seat-pick-status">
              {!mp.mySeatChoice
                ? "请先选择白方或黑方"
                : mp.playerCount < 2
                  ? "等待对手加入…"
                  : !mp.opponentSeatChoice
                    ? "等待对手选边…"
                    : !mp.seatsReady
                      ? "双方不能选同一阵营"
                      : mp.myReady && mp.opponentReady
                        ? "双方已准备，即将开始…"
                        : mp.myReady
                          ? "已准备，等待对手…"
                          : mp.opponentReady
                            ? "对手已准备，请点击准备"
                            : "选边完成，请点击准备"}
            </p>
            {mp.opponentSeatChoice ? (
              <p className="seat-pick-opponent">
                对手已选：
                <strong>
                  {mp.opponentSeatChoice === "white" ? "白方" : "黑方"}
                </strong>
                {mp.opponentReady ? (
                  <span className="seat-pick-ready-tag"> · 已准备</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className={mp.myReady ? "btn-muted" : "btn-reset"}
            disabled={!mp.canPressReady}
            onClick={() => mp.setReady(!mp.myReady)}
          >
            {mp.myReady ? "取消准备" : "准备"}
          </button>
          <button type="button" className="btn-muted" onClick={mp.leave}>
            离开房间
          </button>
        </div>
      ) : null}

      <div className="lobby-join">
        <label className="lobby-label" htmlFor="room-id-input">
          加入房间
        </label>
        <div className="lobby-join-row">
          <input
            id="room-id-input"
            className="lobby-input"
            value={mp.joinInput}
            onChange={(e) => mp.setJoinInput(e.target.value)}
            placeholder="输入 6 位房间号"
            inputMode="numeric"
          />
          <button type="button" className="btn-action" onClick={mp.joinRoom}>
            加入
          </button>
        </div>
      </div>

      {mp.lobbyError ? (
        <p className="online-error" role="alert">
          {mp.lobbyError}
        </p>
      ) : null}
    </div>
  );
}
