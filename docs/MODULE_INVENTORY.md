# 模块与目录清单（源码可读性指南）

## 关于 `node_modules`（请先读这一段）

**`node_modules` 里的内容不是你的业务代码，也不应该、实际上也无法按「功能」重新封装。**

- 运行 `npm install` 时，npm 会把 **每一个第三方库**（React、Vite、Vitest…）各自解压成独立文件夹；这是 **npm 生态的标准形态**，不是项目结构混乱。
- **不要**移动、合并或改名 `node_modules` 里的包；下次安装会被覆盖，且会破坏依赖解析。
- 你要读的「自己写的逻辑」只看：`packages/core/src`、`packages/app/src`、`docs/`、`README.md`。

若觉得根目录 `node_modules` 太大、干扰视线：这是正常现象；可在编辑器里 **折叠/排除** `node_modules`（VS Code/Cursor 均可设置 files.exclude）。

---

## 自有源码总览（这才是「封装层级」）

```
packages/core/src/     ← 棋规与数据（无 UI）
packages/app/src/      ← 浏览器界面（React）
docs/                  ← 给人看的说明，不参与编译
```

---

## `packages/core/src` — 按文件夹说明

| 路径 | 封装的功能 | 与其它部分的关系 |
|------|------------|------------------|
| **`model/`** | 棋子、格子、棋盘 Map、`Move`、`GameSnapshot`、`ChessMeta`、终局类型等 **类型与棋盘工具函数** | 被 `chess/`、`variant/`、`history/` 共用 |
| **`chess/`** | **标准国际象棋**：将军判定、伪合法走法、`applyMove`、合法过滤、初始局面、子力攻击判定（含 `pieceAttacks`） | `variant/` 在此基础上叠加加子棋规则 |
| **`variant/`** | **加子棋变体**：备战区、放置黑王、`pieceIds`、连将、`applyBlackAdd`、空降、变体终局等 | 依赖 `chess/` 的走子与将军 |
| **`moves/`** | 薄封装：把 `chess` 里的 `applyMove`、`legalMoves`、`generatePseudoLegalMoves` **再导出一次** | 兼容早期路径；`history` 仍从这里引用 `applyMove` |
| **`rules/`** | `RuleEngine` 接口 + **标准棋**的 `standardRuleEngine` + **占位** `yourVariantRuleEngine` | **当前主程序不用这套接口玩变体**；变体逻辑在 `variant/`。保留便于以后统一接口或写测试 |
| **`history/`** | 给定初始局面 + 走子序列 → **回放**到当前局面 | 使用 `moves` 里的 `applyMove` |
| **`index.ts`** | 对外 **统一导出**（model / chess 补充导出 / variant / …） | App 与测试 `import "@addchess/core"` |
| **根下 `*.test.ts`** | Vitest 测试：标准棋、变体烟测、连将回归 | 不参与运行时 |

### `variant/` 内各文件（细一点）

| 文件 | 作用 |
|------|------|
| `types.ts` | 变体专用类型：`VariantSnapshot`、备战区、白方加子计数等 |
| `create.ts` | 开局：只有白方棋子，黑方待放王 |
| `snapshot.ts` | `VariantSnapshot` ↔ 标准 `GameSnapshot`、深拷贝 |
| `reserve.ts` | 备战区数量、三类是否齐全、空降解锁条件 |
| `streak.ts` | 白方「连续兵/轻/重」计数规则 |
| `addPiece.ts` | 加子、`whiteLegalPieceKinds`、`applyBlackAdd` |
| `addSquares.ts` | 加子落点合法集合、高亮辅助 |
| `transferIds.ts` | 走一步棋之后 **pieceId 在棋盘上的迁移** |
| `lianjiang.ts` | 连将序列、`whiteCheckUsedIds` 更新 |
| `applyNormal.ts` | 盘面普通走子、开局放置黑王 |
| `teleport.ts` | 空降王 |
| `legal.ts` | 变体下白/黑合法走法、与「伪合法」对比做高亮 |
| `gameStatus.ts` | 变体意义下的终局 |
| `index.ts` | 汇总导出 variant API |

---

## `packages/app/src` — 按文件夹说明

| 路径 | 封装的功能 |
|------|------------|
| **`components/VariantChess.tsx`** | **当前唯一主界面**：备战区、黑方行动按钮、白方选兵种、棋盘格子、升变弹窗 |
| **`hooks/useVariantGame.ts`** | **变体交互状态机**：当前轮到谁、加棋第几步、选中格子、调用 core 的 API |
| **`App.tsx`** | 页面标题 + 挂载 `VariantChess` |
| **`main.tsx`** | React 入口 |
| **`styles/App.css`** | 全局与棋盘样式 |
| **`vite-env.d.ts`** | TypeScript 声明（Vite 客户端类型） |

根目录 **`index.html`**、**`vite.config.ts`**、**`tsconfig.json`**：构建与路径配置，不属于「业务封装」，但不可缺少。

---

## 仓库根目录 / `docs`（非运行时）

| 路径 | 作用 |
|------|------|
| `README.md` | 项目入口说明与命令 |
| `docs/STRUCTURE.md` | 结构导读 |
| `docs/DEPENDENCIES.md` | 依赖说明 |
| `docs/MODULE_INVENTORY.md` | **本清单** |
| `docs/README.md` | 文档索引 |

---

## 是否可以删掉某些文件夹 / 文件？

### 绝对不能删

- **`node_modules/`**：删掉后执行 `npm install` 会完整重装；**不要改内部结构**。
- **`packages/core/src/model`、`chess`、`variant`**：核心逻辑。
- **`packages/app` 里除示例外的主链路**：`VariantChess`、`useVariantGame`、`App`、`main`、样式与 Vite 配置。

### 可考虑删减（仅为「少文件、易读」，非必须）

| 目标 | 说明 |
|------|------|
| **`rules/your-variant.ts`** | 占位引擎，**当前 UI 未使用**。删掉需在 `rules/index.ts`、`core/src/index.ts` 去掉导出并确认无外部引用。 |
| **`history/`** | 若确定不做棋谱回放 API，可删并改 `core/src/index.ts`；若有脚本/测试依赖则保留。 |
| **`moves/`** | 只是 re-export；可改为全仓直接 `from chess/...`，能少一层目录但改动面大，**性价比一般**。 |

### 已清理的遗留

曾用于「仅标准棋」演示的 **`Board.tsx`**、**`useGame.ts`** 已从当前仓库移除，避免与 `VariantChess` / `useVariantGame` 混淆。

---

## 结论：算不算「已经按功能封装好了」？

- **业务源码**：已是 **`model`（数据） / `chess`（标准棋） / `variant`（加子棋） / `app`（界面）** 的分层；`variant` 内部又按备战、加子、连将、空降等拆文件。**无需为了「再封装一层」而大搬家**，大 refactor 收益有限、容易引入 bug。
- **`node_modules`**：**不是封装不好**，而是 **第三方包的存放方式**；阅读与维护时请直接忽略或折叠。

若你希望下一步「只做减法」：我可以按你确认的范围，帮你删掉 **history / rules 占位 / 旧 Board** 等并保证 `npm test` 与 `npm run build` 仍通过。
