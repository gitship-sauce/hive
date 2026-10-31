import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("our server with a WebSocket (T5.1)", () => {
  test("a logged-in page opens /ws, and Next's live reload socket still works", async ({ page }) => {
    const sockets: string[] = [];
    page.on("websocket", (ws) => sockets.push(new URL(ws.url()).pathname));

    await signUp(page, uniqueName("ws"));
    await expect.poll(() => sockets).toContain("/ws");
    await expect.poll(() => sockets.some((p) => p.startsWith("/_next/hmr"))).toBe(true);
  });

  test("the socket closes on log out and doesn't reconnect", async ({ page }) => {
    let ws: import("@playwright/test").WebSocket | undefined;
    page.on("websocket", (s) => {
      if (s.url().endsWith("/ws")) ws = s;
    });
    await signUp(page, uniqueName("ws"));
    await expect.poll(() => ws).toBeDefined();

    const closed = ws!.waitForEvent("close");
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await closed;
    await expect(page).toHaveURL("/login");
  });
});
