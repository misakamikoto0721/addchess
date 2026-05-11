import rulesSource from "../../../../docs/RULES.md?raw";

export function RulesDoc() {
  return (
    <section id="game-rules" className="rules-doc" aria-labelledby="rules-heading">
      <h2 id="rules-heading">游戏规则说明</h2>
      <p className="rules-doc-note">
        与仓库中的 <code>docs/RULES.md</code> 同源；在 GitHub 上也可直接打开该文件阅读。
      </p>
      <pre className="rules-md">{rulesSource}</pre>
    </section>
  );
}
