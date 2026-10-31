import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

// The test server runs without Firebase keys, like a fresh clone before the Firebase setup.
test.describe("turn on push (T6.4)", () => {
  test("without Firebase keys the button doesn't show and the service worker isn't served", async ({ page }) => {
    await signUp(page, uniqueName("push"));
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Turn on notifications", exact: true })).toHaveCount(0);
    expect((await page.request.get("/firebase-messaging-sw.js")).status()).toBe(404);
  });

  test("the register API needs a login and a valid installation id", async ({ page, playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL });
    const noLogin = await anonymous.post("/api/push/register", { data: { fid: "fid_abcdefghijk" } });
    expect(noLogin.status()).toBe(401);
    await anonymous.dispose();

    await signUp(page, uniqueName("push"));
    const bad = await page.request.post("/api/push/register", { data: { fid: "<script>" } });
    expect(bad.status()).toBe(400);
    const notJson = await page.request.post("/api/push/register", { data: "nope" });
    expect(notJson.status()).toBe(400);
    const ok = await page.request.post("/api/push/register", { data: { fid: "cWxZ1a2b3c4d5e6f7g8h9i" } });
    expect(ok.status()).toBe(204);
  });
});
