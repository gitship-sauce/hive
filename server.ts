// Our own server: Next.js for pages, plus a WebSocket at /ws for live messages and notifications.
// Run with `npm run dev`, or `npm start` (production, after `npm run build`).
import { createServer } from "node:http";
import { loadEnv } from "./scripts/env";

const production = process.argv.includes("--production");
// Must be set before Next.js and React load, so they pick their production builds.
(process.env as Record<string, string>).NODE_ENV = production ? "production" : "development";
loadEnv();

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "localhost";

const { default: next } = await import("next");
const { attachRealtime } = await import("./src/lib/realtime");

const app = next({ dev: !production, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error("Request failed", req.url, err);
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
});
attachRealtime(server, { dev: !production });

// Listen only on HOSTNAME (localhost by default), so a dev server isn't open to the whole network.
server.listen(port, hostname, () => {
  console.log(`> Hive ready on http://${hostname}:${port} (${production ? "production" : "development"})`);
});
