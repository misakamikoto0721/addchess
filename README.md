# AddChess（加子棋）

浏览器中的**自定义规则国际象棋**项目：**玩法与规则全文见 [《加子棋规则说明》](./docs/RULES.md)**。界面使用 React + Vite；规则与棋盘逻辑在独立 npm 包 `@addchess/core` 中，便于测试与复用。

## 线上地址

| 用途 | 地址 |
|------|------|
| **网页** | https://addchess.cn |
| **联机 WebSocket** | `wss://ws.addchess.cn` |

线上前后端均托管在 **腾讯云香港**（见 [docs/DEPLOY-SERVER-CN.md](./docs/DEPLOY-SERVER-CN.md)）。

## 快速开始（本地开发）

**工作目录**：请在仓库**根目录**执行下列命令。

```bash
git clone https://github.com/misakamikoto0721/addchess.git
cd addchess
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

本地联机需另开终端：

```bash
npm run dev:server   # ws://localhost:3000
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动**前端**（5173） |
| `npm run dev:server` | 启动**联机后端**（3000 WebSocket） |
| `npm run build` | 构建**前端**（`packages/app/dist`） |
| `npm run build:server` | 构建**后端** |
| `npm run build:prod` | 构建后端 + 前端（VPS 上需配合 `VITE_WS_URL`） |
| `bash scripts/deploy-all.sh` | **VPS 上一键拉代码、构建、发布** |
| `npm test` | 运行 `@addchess/core` 单元测试 |

## 部署（生产）

前后端均部署在 **腾讯云轻量（香港）** + **addchess.cn**：

- 前端：Nginx 静态托管 → `https://addchess.cn`
- 后端：pm2 + Nginx 反代 → `wss://ws.addchess.cn`

完整步骤：[docs/DEPLOY-SERVER-CN.md](./docs/DEPLOY-SERVER-CN.md)

生产环境变量示例：

- `packages/app/.env.production.example` — 前端构建时的 `VITE_WS_URL`
- `deploy/config.env.example` — VPS 上的域名与路径

## 仓库结构

| 包 | 说明 |
|----|------|
| **`packages/app`** | React 前端 |
| **`packages/server`** | Node 联机 WebSocket 服务 |
| **`packages/core`** | 共享规则引擎 |

联机架构见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 技术栈

TypeScript · React 19 · Vite 6 · Vitest（core）

## 规则与实现

- 规则说明：[docs/RULES.md](./docs/RULES.md)
- 引擎：`packages/core/src/variant/`

## 许可证

若开源发布，请在仓库根目录自行添加 `LICENSE` 文件。
