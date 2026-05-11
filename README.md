# AddChess（加子棋）

浏览器中的**自定义规则国际象棋**项目：包含标准走子引擎与当前实现的「加子棋」变体（黑方备战区、白方指定兵种加子、连将限制、空降王等）。界面使用 React + Vite；规则与棋盘逻辑在独立 npm 包 `@addchess/core` 中，便于测试与复用。

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
| `npm run dev` | 启动前端开发服务器（`packages/app`） |
| `npm run build` | 生产构建前端（会把 core 源码一并打包进 bundle） |
| `npm run build:core` | 单独用 tsup 构建 `@addchess/core` 的 `dist/`（发布 npm 时用） |
| `npm test` | 运行 `@addchess/core` 的 Vitest 单元测试 |
| `npm run preview -w @addchess/app` | 本地预览构建产物 |

## 仓库结构（鸟瞰）

本项目是 **npm workspaces 单体仓库**：

- **`packages/core`** → 包名 `@addchess/core`：棋盘模型、标准棋走子/将军、变体状态与合法着法。
- **`packages/app`** → 包名 `@addchess/app`：React UI，依赖 `@addchess/core`（开发时通过 Vite alias 直接引用源码）。

根目录的 `package.json` 只负责聚合脚本与子包，不包含业务代码。

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

变体规则由你与助手逐步约定；当前实现集中在 `packages/core/src/variant/`。若你要改规则，优先改该目录下的模块，再在 `packages/app` 中调整交互。

## 上传到 GitHub 时注意

1. 依赖与忽略规则见上文「提交到 GitHub 时要不要带上依赖？」；**务必提交 `package-lock.json`**，便于他人 `npm ci` / `npm install` 复现版本。  
2. 本地构建：`npm run build`，产物在 `packages/app/dist/`（默认被忽略；若使用 GitHub Pages，可用 Action 构建或按需提交 `dist`）。

## 许可证

若开源发布，请在仓库根目录自行添加 `LICENSE` 文件（本仓库未内置默认许可证）。
