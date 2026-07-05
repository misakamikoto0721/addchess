import { MultiplayerPanel } from "./components/MultiplayerPanel.js";
import { Suspense, lazy, useState } from "react";

const VariantChess = lazy(() =>
  import("./components/VariantChess.js").then((m) => ({
    default: m.VariantChess,
  })),
);

const RulesDoc = lazy(() =>
  import("./components/RulesDoc.js").then((m) => ({
    default: m.RulesDoc,
  })),
);

type PlayMode = "online" | "local";

function LoadNotice() {
  return <p className="load-notice">加载中…</p>;
}

export function App() {
  const [mode, setMode] = useState<PlayMode>("online");
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-topbar">
          <div className="app-brand">
            <h1>AddChess</h1>
            <p className="app-tagline">
              {mode === "online" ? "加子棋 · 联机对战" : "加子棋 · 本地对局"}
            </p>
          </div>
          {mode === "online" ? (
            <button
              type="button"
              className="btn-muted btn-mode-alt"
              onClick={() => setMode("local")}
            >
              本地对局
            </button>
          ) : (
            <button
              type="button"
              className="btn-muted btn-mode-alt"
              onClick={() => setMode("online")}
            >
              返回联机
            </button>
          )}
        </div>
        {mode === "online" ? (
          <p className="app-subtitle">
            创建或加入房间，与对手在线对弈。规则见{" "}
            <a
              className="app-rules-link"
              href="#game-rules"
              onClick={() => setRulesOpen(true)}
            >
              游戏规则说明
            </a>
            。
          </p>
        ) : (
          <p className="app-subtitle">同一设备双人对战，无需联网。</p>
        )}
      </header>
      <main className="app-main">
        {mode === "online" ? (
          <MultiplayerPanel />
        ) : (
          <Suspense fallback={<LoadNotice />}>
            <VariantChess />
          </Suspense>
        )}

        {mode === "local" ? (
          <Suspense fallback={null}>
            <RulesDoc />
          </Suspense>
        ) : (
          <details
            className="rules-collapsed"
            id="game-rules"
            open={rulesOpen}
            onToggle={(e) => setRulesOpen(e.currentTarget.open)}
          >
            <summary>游戏规则说明</summary>
            {rulesOpen ? (
              <Suspense fallback={<LoadNotice />}>
                <RulesDoc />
              </Suspense>
            ) : null}
          </details>
        )}
      </main>
    </div>
  );
}
