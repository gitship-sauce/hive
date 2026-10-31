import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { attachRealtime, getHub } from "@/lib/realtime";
import { createSession, hashToken } from "@/lib/sessions";
import { makeUser } from "./helpers";

let server: Server;
let base: string;

beforeEach(async () => {
  server = createServer((_req, res) => res.end("ok"));
  attachRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  server.closeAllConnections();
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
