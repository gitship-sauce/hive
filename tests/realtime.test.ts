import { createServer, request, type Server } from "node:http";
import { connect as tcpConnect } from "node:net";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { attachRealtime, getHub } from "@/lib/realtime";
import { createSession, hashToken } from "@/lib/sessions";
import { makeUser } from "./helpers";

let server: Server;
let base: string;
let serverSockets: Set<import("node:net").Socket>;

beforeEach(async () => {
  server = createServer((_req, res) => res.end("ok"));
  serverSockets = new Set();
  server.on("connection", (s) => {
    serverSockets.add(s);
    s.on("close", () => serverSockets.delete(s));
  });
  attachRealtime(server, { dev: true });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  // Upgraded and unanswered sockets aren't closed by server.close(), so close them here.
  for (const s of serverSockets) s.destroy();
  await new Promise((resolve) => server.close(resolve));
});

/** Connects like a browser on our page would: same Origin, session cookie. */
function connect(token?: string, origin = `http://${base}`) {
  const headers: Record<string, string> = { Origin: origin };
  if (token) headers.Cookie = `session=${token}`;
  return new WebSocket(`ws://${base}/ws`, { headers });
}

function opened(ws: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
}

function refusedWith(ws: WebSocket) {
  return new Promise<number>((resolve) => {
    ws.once("unexpected-response", (_req, res) => resolve(res.statusCode ?? 0));
    ws.once("open", () => resolve(101));
  });
}

function nextMessage(ws: WebSocket) {
  return new Promise<unknown>((resolve) => ws.once("message", (data) => resolve(JSON.parse(String(data)))));
}

describe("WebSocket at /ws (T5.1)", () => {
  it("lets a browser with a valid session connect", async () => {
    const { token } = await createSession(await makeUser("gitsy"));
    const ws = connect(token);
    await expect(opened(ws)).resolves.toBeUndefined();
    ws.close();
  });

  it("refuses a connection without a session, or with a made-up one", async () => {
    expect(await refusedWith(connect())).toBe(401);
    expect(await refusedWith(connect("made-up"))).toBe(401);
  });

  it("refuses a connection from another website, even with a valid cookie", async () => {
    const { token } = await createSession(await makeUser("gitsy"));
    expect(await refusedWith(connect(token, "https://evil.example"))).toBe(403);
  });

  it("sends an event only to the user it is for", async () => {
    const a = await makeUser("alice");
    const b = await makeUser("bob");
    const wsA = connect((await createSession(a)).token);
    const wsB = connect((await createSession(b)).token);
    await Promise.all([opened(wsA), opened(wsB)]);

    let bGotSomething = false;
    wsB.on("message", () => (bGotSomething = true));
    const got = nextMessage(wsA);
    expect(getHub().sendToUser(a, { type: "notifications", unread: 3 })).toBe(1);
    expect(await got).toEqual({ type: "notifications", unread: 3 });
    await new Promise((r) => setTimeout(r, 50));
    expect(bGotSomething).toBe(false);
    wsA.close();
    wsB.close();
  });

  it("closes the sockets of a session when it logs out", async () => {
    const { token } = await createSession(await makeUser("gitsy"));
    const ws = connect(token);
    await opened(ws);
    const closed = new Promise<number>((resolve) => ws.once("close", (code) => resolve(code)));
    getHub().closeSession(hashToken(token));
    expect(await closed).toBe(4001);
  });
});

describe("WebSocket safety (F14, F17)", () => {
  function upgradeStatus(path: string, timeoutMs = 300) {
    return new Promise<number | "no answer">((resolve) => {
      const req = request(`http://${base}${path}`, {
        headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Version": "13", "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==" },
      });
      req.on("response", (res) => resolve(res.statusCode ?? 0));
      req.on("upgrade", () => resolve(101));
      req.on("error", () => resolve(0));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve("no answer");
      });
      req.end();
    });
  }

  it("refuses upgrades on any other path instead of leaving them open", async () => {
    expect(await upgradeStatus("/anything")).toBe(404);
  });

  it("in development, leaves Next's live-reload socket to Next", async () => {
    expect(await upgradeStatus("/_next/hmr")).toBe("no answer");
  });

  it("a browser that disconnects during the session check doesn't stop the server", async () => {
    const { token } = await createSession(await makeUser("gitsy"));
    const port = (server.address() as AddressInfo).port;
    const raw = tcpConnect(port, "127.0.0.1");
    await new Promise((r) => raw.once("connect", r));
    raw.write(
      `GET /ws HTTP/1.1\r\nHost: ${base}\r\nOrigin: http://${base}\r\nCookie: session=${token}\r\n` +
        "Connection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n",
    );
    raw.resetAndDestroy(); // like a tab closing mid-request: the server's socket gets ECONNRESET
    await new Promise((r) => setTimeout(r, 100));

    // Still alive: a normal connection works.
    const ws = connect(token);
    await expect(opened(ws)).resolves.toBeUndefined();
    ws.close();
  });
});
