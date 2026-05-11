import { VariantChess } from "./components/VariantChess.js";
import { RulesDoc } from "./components/RulesDoc.js";

export function App() {
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
      </header>
      <main>
        <VariantChess />
        <RulesDoc />
      </main>
    </div>
  );
}
