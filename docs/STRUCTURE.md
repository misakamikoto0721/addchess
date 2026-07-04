# 文件结构说明

本文说明 **源代码层面** 的目录含义（不包含 `node_modules`、构建生成的 `dist`）。阅读时配合仓库根目录一起看。

---

## 1. 为什么分成三个 `packages`？

| 包 | 层级 | 作用 |
|----|------|------|
| **`@addchess/core`** | **共享** | 纯逻辑：棋盘、走子、将军、变体状态。无 DOM、无 React、无网络。浏览器与 Node 均可 import。 |
| **`@addchess/app`** | **前端** | 人机界面：按钮、棋盘、悔棋。在**用户浏览器**里运行。 |
| **`@addchess/server`** | **后端** | 联机：房间号、WebSocket、广播局面（**当前为骨架**，见 `packages/server/`）。在**服务器**上常驻运行。 |

这样拆的好处：**改规则主要在 core**；**改界面在 app**；**改联机在 server**；三者职责不混。

整体分工见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 2. 根目录

```
addchess/
├── package.json          # workspaces 定义 + 统一脚本（dev / build / test）
├── package-lock.json     # 锁定整个工作区依赖版本（建议提交到 Git）
├── tsconfig.base.json    # 子包共用的 TypeScript 编译选项
├── .gitignore
├── README.md
└── docs/                 # 说明文档（本文件所在目录）
```

---

## 3. `packages/core`（`@addchess/core`）

引擎与变体规则的**唯一权威实现**。

```
packages/core/
├── package.json          # 包名、tsup/vitest 脚本、开发依赖
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts          # 对外统一导出（标准棋 API + 变体 API）
    │
    ├── model/            # 与「棋子、格子、局面」相关的类型与工具
    │   ├── types.ts      # Square, Piece, Move, GameSnapshot, ChessMeta 等
    │   ├── Board.ts      # squareKey、pieceAt、cloneBoard、emptyBoard
    │   └── index.ts
    │
    ├── chess/            # 标准国际象棋（完整规则）
    │   ├── position.ts   # 初始局面、默认 meta
    │   ├── coords.ts   # 格子方向、马步等常量
    │   ├── attacks.ts  # 格子是否被攻击、王是否在将军中
    │   ├── pieceAttacks.ts   # 单枚棋子是否攻击某格（用于列将军子）
    │   ├── pseudoLegalMoves.ts  # 伪合法走法生成（含易位、过路兵）
    │   ├── applyMove.ts  # 执行一步走子（更新棋盘与 meta）
    │   ├── legalMoves.ts # 过滤掉「送王」后的合法走法
    │   └── status.ts     # 将杀、困毙、50 回合、子力不足等
    │
    ├── variant/          # 「加子棋」变体（当前主线玩法）
    │   ├── types.ts      # VariantSnapshot、备战区、白方加子计数等
    │   ├── create.ts     # 初始局面（仅白方棋子 + 待放黑王）
    │   ├── snapshot.ts   # 与标准 GameSnapshot 互转、cloneVariant
    │   ├── reserve.ts    # 备战区三类是否齐全、空降解锁条件
    │   ├── streak.ts     # 白方指定兵种时的「连续兵/轻/重」计数规则
    │   ├── addPiece.ts   # 加子、applyBlackAdd、whiteLegalPieceKinds
    │   ├── addSquares.ts # 加子时可落哪些空格、高亮辅助
    │   ├── transferIds.ts    # 走子后 pieceId 映射如何迁移（连将用）
    │   ├── lianjiang.ts        # 连将序列与 whiteCheckUsedIds 更新
    │   ├── applyNormal.ts      # 盘面走子 + 放置黑王开局
    │   ├── teleport.ts         # 空降王
    │   ├── legal.ts            # 白/黑合法走法 + 高亮用 pseudo 对比
    │   ├── gameStatus.ts       # 变体终局判定
    │   └── index.ts            # variant 子模块导出
    │
    ├── moves/index.ts    # 转发 chess 的 applyMove / legalMoves 等（兼容旧路径）
    ├── rules/            # RuleEngine 接口与标准棋引擎占位
    ├── history/index.ts  # 棋谱回放（依赖 applyMove）
    │
    ├── Board.test.ts           # 标准棋逻辑测试
    └── variant/*.test.ts       # 变体烟测、连将回归测试等
```

### 数据流（便于调试）

- **标准棋**：`GameSnapshot`（`board` + `sideToMove` + `ChessMeta`）。
- **变体**：`VariantSnapshot` = 上述棋盘/meta/走棋方 + **`pieceIds`**（每格棋子唯一 id，连将用）+ **`reserve`**（黑备战）+ **`whiteAddStreak`** + **`whiteCheckUsedIds`** + 阶段字段等。

---

## 4. `packages/app`（`@addchess/app`）

面向用户的 **Vite + React** 应用。

```
packages/app/
├── package.json
├── vite.config.ts        # React 插件；@addchess/core → 指向 ../core/src/index.ts（开发直连源码）
├── tsconfig.json
├── index.html            # 入口 HTML，挂载 #root
└── src/
    ├── main.tsx          # ReactDOM.createRoot
    ├── App.tsx           # 页面壳 + 标题，挂载 VariantChess
    ├── vite-env.d.ts
    ├── styles/App.css    # 全局与棋盘、侧栏、按钮样式
    ├── components/
    │   └── VariantChess.tsx   # 主界面：备战区 + 黑方行动 + 棋盘
    └── hooks/
        └── useVariantGame.ts  # 变体交互状态机（选子、加棋步骤、升变）
```

**依赖方向**：只允许 `app → core`、`server → core`，不要从 core 引用 React 或 server 代码。

---

## 5. `packages/server`（`@addchess/server`）

**后端**联机服务（Node）。与浏览器里的 `app` 分离部署。

```
packages/server/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts       # HTTP 入口；将来挂载 WebSocket
    ├── protocol.ts    # 前后端消息类型（规划）
    └── rooms.ts       # 房间号与内存房间表（规划）
```

**依赖方向**：`server → core`（着法校验、初始化局面）。

---

## 6. 模块依赖关系（简图）

```
Browser: @addchess/app (React)
  └── 调用 @addchess/core

Cloud: @addchess/server (Node)
  └── 调用 @addchess/core（权威校验 + 广播 snapshot）

@addchess/core
  ├── model
  ├── chess
  └── variant
```

---

## 7. 若你想改代码，从哪里下手？

| 目标 | 建议目录 |
|------|----------|
| 改「加子棋」规则（谁能走、能否加子、连将判定） | `packages/core/src/variant/` |
| 改标准棋（易位、过路兵、将军判定） | `packages/core/src/chess/` |
| 改棋盘样式、按钮流程 | `packages/app/src/components/`、`hooks/useVariantGame.ts`、`styles/App.css` |
| 改联机、房间号、WebSocket | `packages/server/src/`（待实现） |

如有新文档需求，可继续在 `docs/` 下追加专题页（例如「规则说明书」单独一页）。
