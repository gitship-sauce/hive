import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { getUserBySessionToken, hashToken, SESSION_COOKIE } from "./sessions";

export const WS_PATH = "/ws";
const HEARTBEAT_MS = 30_000;

/** Everything the server can push to a browser. */
export type RealtimeEvent =
  | { type: "message"; message: { id: number; from: string; to: string; body: string; createdAt: string } }
  | { type: "notifications"; unread: number };

type Client = { ws: WebSocket; userId: number; sessionId: string; alive: boolean };

class Hub {
  private clients = new Set<Client>();

  add(client: Client) {
    this.clients.add(client);
    client.ws.on("close", () => this.clients.delete(client));
  }

  /** Sends to every open tab of one user. Returns how many tabs got it. */
  sendToUser(userId: number, event: RealtimeEvent) {
    const data = JSON.stringify(event);
    let sent = 0;
    for (const c of this.clients) {
      if (c.userId === userId && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(data);
        sent++;
      }
    }
    return sent;
  }

  /** Closes the sockets of one session, e.g. on log out. */
  closeSession(sessionId: string) {
    for (const c of this.clients) if (c.sessionId === sessionId) c.ws.close(4001, "Logged out");
  }

  heartbeat() {
    for (const c of this.clients) {
      if (!c.alive) {
        c.ws.terminate();
        continue;
      }
      c.alive = false;
      c.ws.ping();
    }
  }
}

// server.ts (run by tsx) and the app code (bundled by Next.js) load this file as two separate
// copies, so the one hub lives on globalThis where both can reach it.
const globalForHub = globalThis as unknown as { realtimeHub?: Hub };
export function getHub(): Hub {
  globalForHub.realtimeHub ??= new Hub();
  return globalForHub.realtimeHub;
}

function readCookie(header: string | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function refuse(socket: Duplex, status: string) {
  if (!socket.destroyed) socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
}

/**
 * Adds the WebSocket endpoint at /ws to the server.
 * In development, Next.js's own live-reload socket (under /_next/) is left to Next.js; anything else is refused.
 */
export function attachRealtime(server: Server, { dev }: { dev: boolean }) {
  const wss = new WebSocketServer({ noServer: true });
  const hub = getHub();

  server.on("upgrade", async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path !== WS_PATH) {
      if (dev && path.startsWith("/_next/")) return;
      // Nobody else answers these, so without this they would stay open forever.
      return refuse(socket, "404 Not Found");
    }

    // Node removes its own error handler before "upgrade". Without this one, a browser that
    // disconnects during the session check below throws an uncaught error and stops the server.
    const onSocketError = (err: Error) => console.warn("A WebSocket closed before it opened:", err.message);
    socket.on("error", onSocketError);

    try {
      // Browsers send cookies with WebSocket requests from any site, so check the page is ours.
      const origin = req.headers.origin;
      if (!origin || new URL(origin).host !== req.headers.host) return refuse(socket, "403 Forbidden");

      const token = readCookie(req.headers.cookie, SESSION_COOKIE);
      const user = await getUserBySessionToken(token);
      if (socket.destroyed) return;
      if (!user || !token) return refuse(socket, "401 Unauthorized");

      wss.handleUpgrade(req, socket, head, (ws) => {
        socket.off("error", onSocketError);
        const client: Client = { ws, userId: user.id, sessionId: hashToken(token), alive: true };
        ws.on("pong", () => (client.alive = true));
        ws.on("error", (err) => console.error("WebSocket error", err));
        hub.add(client);
      });
    } catch (err) {
      console.error("WebSocket upgrade failed", err);
      refuse(socket, "500 Internal Server Error");
    }
  });

  const timer = setInterval(() => hub.heartbeat(), HEARTBEAT_MS);
  server.on("close", () => {
    clearInterval(timer);
    wss.close();
  });
  return wss;
}
