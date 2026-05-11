import { VariantChess } from "./components/VariantChess.js";

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AddChess</h1>
        <p className="app-subtitle">
          加子棋变体：黑先放置王；黑方可走棋、加棋或一次性空降王；白方连将限制与加子计数见规则说明。
        </p>
      </header>
      <main>
        <VariantChess />
      </main>
    </div>
  );
}
