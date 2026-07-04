import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { parseClientMessage } from "@addchess/core";
import { handleClientMessage, onSocketClose } from "./handler.js";

const PORT = Number(process.env.PORT ?? 3000);

const httpServer = createServer((req, res) => {
  const url = req.url ?? "/";

  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "addchess-server",
        ws: `ws://localhost:${PORT}`,
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("AddChess multiplayer server\n");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const raw = JSON.parse(String(data)) as unknown;
      const msg = parseClientMessage(raw);
      if (!msg) {
        ws.send(JSON.stringify({ type: "error", message: "无效消息" }));
        return;
      }
      handleClientMessage(ws, msg);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "JSON 解析失败" }));
    }
  });

  ws.on("close", () => onSocketClose(ws));
});

httpServer.listen(PORT, () => {
  console.log(`[@addchess/server] http://localhost:${PORT}`);
  console.log(`  WebSocket ws://localhost:${PORT}`);
  console.log(`  GET /health`);
});
