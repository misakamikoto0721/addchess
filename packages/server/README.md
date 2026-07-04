# @addchess/server（后端）

联机服务：WebSocket + 房间号 + 用 `@addchess/core` 校验并广播局面。

## 本地开发

在仓库根目录开**两个终端**：

```bash
npm run dev:server   # 终端 1 → ws://localhost:3000
npm run dev          # 终端 2 → http://localhost:5173
```

浏览器打开前端 → **联机对战** → 一个窗口「创建房间」，另一个「加入房间」→ 两人点「开始游戏」。

## 已实现（MVP）

- WebSocket 消息：`createRoom` / `joinRoom` / `startGame` / 着法与加子相关 action
- 内存房间（重启服务器房间清空）
- 局面序列化见 `@addchess/core` 的 `variantToWire` / `variantFromWire`

## 目录

| 文件 | 作用 |
|------|------|
| `src/index.ts` | HTTP + WebSocket 入口 |
| `src/handler.ts` | 消息处理、调用 core |
| `src/rooms.ts` | 房间与连接映射 |

协议类型在 `packages/core/src/multiplayer/protocol.ts`（前后端共用）。

详见 [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)。
