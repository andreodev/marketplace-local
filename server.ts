import { createServer } from "node:http";
import next from "next";
import { Client } from "pg";
import { WebSocket, WebSocketServer } from "ws";
import { verifyChatTicket } from "./src/modules/chat/ticket";

async function main() {
const dev = process.env.npm_lifecycle_event !== "start" && process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
await app.prepare();

const sockets = new Map<string, Set<WebSocket>>();
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
const listener = new Client({ connectionString: process.env.DATABASE_URL });
await listener.connect();
await listener.query("LISTEN chat_events");
listener.on("notification", (notification) => {
  if (!notification.payload) return;
  try {
    const event = JSON.parse(notification.payload) as { users: string[]; conversationId: string };
    for (const userId of event.users) {
      for (const socket of sockets.get(userId) ?? []) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "message", conversationId: event.conversationId }));
      }
    }
  } catch (error) {
    console.error("Invalid chat notification", error);
  }
});
listener.on("error", (error) => console.error("Chat listener failed", error));

const server = createServer((request, response) => app.getRequestHandler()(request, response));
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname !== "/chat/socket") {
    if (dev) void app.getUpgradeHandler()(request, socket, head);
    else socket.destroy();
    return;
  }
  const origin = request.headers.origin;
  const host = request.headers.host;
  const ticket = verifyChatTicket(url.searchParams.get("ticket") || "");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && host && new URL(origin).host === host); } catch { /* Invalid origin. */ }
  if (!sameOrigin || !ticket) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (websocket) => {
    console.log("Chat socket connected", ticket.userId);
    const userSockets = sockets.get(ticket.userId) ?? new Set<WebSocket>();
    userSockets.add(websocket);
    sockets.set(ticket.userId, userSockets);
    const expiry = setTimeout(() => websocket.close(1000, "Renew ticket"), Math.max(1, ticket.expiresAt - Date.now()));
    websocket.on("close", () => {
      console.log("Chat socket closed", ticket.userId);
      clearTimeout(expiry);
      userSockets.delete(websocket);
      if (!userSockets.size) sockets.delete(ticket.userId);
    });
  });
});
server.listen(port, hostname, () => console.log(`Perto listening on http://${hostname}:${port}`));
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
