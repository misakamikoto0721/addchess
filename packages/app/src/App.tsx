import { VariantChess } from "./components/VariantChess.js";
import { MultiplayerPanel } from "./components/MultiplayerPanel.js";
import { RulesDoc } from "./components/RulesDoc.js";
import { useState } from "react";

type PlayMode = "local" | "online";

export function App() {
  const [mode, setMode] = useState<PlayMode>("local");

  return (
    <div className="app">
      <header className="app-header">
        <h1>AddChess</h1>
        <p className="app-subtitle">
          加子棋变体：黑先放置王；黑方可走棋、加棋或一次性空降王；白方连将限制与加子计数见{" "}
          <a className="app-rules-link" href="#game-rules">
            游戏规则说明
          </a>
          。
        </p>
        <div className="mode-tabs" role="tablist" aria-label="游戏模式">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "local"}
            className={mode === "local" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("local")}
          >
            本地对局
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "online"}
            className={mode === "online" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("online")}
          >
            联机对战
          </button>
        </div>
      </header>
      <main>
        {mode === "local" ? <VariantChess /> : <MultiplayerPanel />}
        <RulesDoc />
      </main>
    </div>
  );
}
