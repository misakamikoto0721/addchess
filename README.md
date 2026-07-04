# AddChess（加子棋）

浏览器中的**自定义规则国际象棋**项目：**玩法与规则全文见 [《加子棋规则说明》](./docs/RULES.md)**。界面使用 React + Vite；规则与棋盘逻辑在独立 npm 包 `@addchess/core` 中，便于测试与复用。

## 快速开始

**工作目录**：请在仓库**根目录**执行下列命令（根目录下有 `package.json`、`packages/` 文件夹）。  
不要在 `packages/app` 里单独 `npm install`（除非你知道自己在做隔离安装；本仓库默认用根目录 workspaces 一次装全）。

```bash
git clone <你的仓库地址>
cd addchess          # 进入仓库根目录
npm install          # 安装依赖（只需在每台电脑 / 每次克隆后执行一次）
npm run dev
```

浏览器打开终端提示的地址（一般为 `http://localhost:5173`）。

### 为何你本地可能「没手动装过」也有 `node_modules`？

若此前在本机由他人/助手代跑过 `npm install`，依赖已经下载到磁盘，不必重复安装。换电脑、删过 `node_modules`、或刚 `git clone` 下来时，**必须在根目录再执行一次 `npm install`**。

### 提交到 GitHub 时要不要带上依赖？

**不要上传 `node_modules`**。只上传：

- **源码**：`packages/`、`docs/` 等  
- **配置文件**：根目录与子包的 `package.json`、**`package-lock.json`**、`.gitignore`、`tsconfig*.json`、`vite.config.ts` 等  
- **不要提交**：`node_modules/`、`dist/`、`.vite/`（已在 `.gitignore` 中）

别人克隆后在他们自己电脑上执行 `npm install`，会根据 `package-lock.json` 下载相同版本的依赖。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动**前端**（5173） |
| `npm run dev:server` | 启动**联机后端**（3000 WebSocket） |
| `npm run start:server` | 生产模式启动联机后端（VPS 上用 pm2 调用） |
| `npm run build` | 生产构建**前端**静态站（`packages/app/dist`） |
| `npm run build:server` | 构建**后端**（`packages/server/dist`） |
| `npm run build:core` | 构建共享规则包 `@addchess/core`（联机校验时会用到） |
| `npm test` | 运行 `@addchess/core` 的 Vitest 单元测试 |
| `npm run preview -w @addchess/app` | 本地预览前端构建产物 |

## 仓库结构（鸟瞰）

本项目是 **npm workspaces 单体仓库**，拆成 **前端 / 后端 / 共享规则** 三包：

| 包 | 层级 | 说明 |
|----|------|------|
| **`packages/app`** → `@addchess/app` | **前端** | React UI，在**浏览器**运行 |
| **`packages/server`** → `@addchess/server` | **后端** | Node 联机服务（**骨架**，WebSocket 待做） |
| **`packages/core`** → `@addchess/core` | **共享** | 棋规与局面；浏览器与服务器**共用** |

**当前可玩的本地对局** = 只有 **app + core**，没有联机后端。  
前后端分工与联机数据流见：[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

更细的**目录树与每个文件夹含义**见：[docs/STRUCTURE.md](./docs/STRUCTURE.md)。  
**每个文件夹干什么、`node_modules` 能否动、哪些可删**：见 [docs/MODULE_INVENTORY.md](./docs/MODULE_INVENTORY.md)。

## 技术栈

- **语言**：TypeScript  
- **前端**：React 19、Vite 6  
- **测试**：Vitest（仅 core）  
- **core 打包**：tsup（可选，用于发布独立包）

## 依赖说明

直接依赖及用途汇总见：[docs/DEPENDENCIES.md](./docs/DEPENDENCIES.md)。

## 规则与实现对应关系

- **给玩家 / 读者看的规则说明**：[docs/RULES.md](./docs/RULES.md)  
- **引擎实现**：当前变体逻辑集中在 `packages/core/src/variant/`。若你要改规则，优先改该目录下的模块并同步更新 `docs/RULES.md`，再在 `packages/app` 中调整交互。

## 上传到 GitHub 时注意

1. 依赖与忽略规则见上文「提交到 GitHub 时要不要带上依赖？」；**务必提交 `package-lock.json`**，便于他人 `npm ci` / `npm install` 复现版本。  
2. 本地构建：`npm run build`，产物在 `packages/app/dist/`（默认被忽略；若使用 GitHub Pages，可用 Action 构建或按需提交 `dist`）。

## 许可证

若开源发布，请在仓库根目录自行添加 `LICENSE` 文件（本仓库未内置默认许可证）。
