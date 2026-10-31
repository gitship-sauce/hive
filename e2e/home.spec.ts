import { expect, test } from "@playwright/test";

test.describe("pages need a login (T1.3)", () => {
  for (const path of ["/", "/search", "/messages", "/notifications"]) {
    test(`a logged-out visitor to ${path} is sent to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL("/login");
    });
  }

  test("a made-up session cookie is sent to /login too", async ({ page, context }) => {
    await context.addCookies([{ name: "session", value: "made-up", url: "http://localhost:3100" }]);
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("log in and sign up pages open without a login", async ({ page }) => {
    for (const path of ["/login", "/signup"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    }
  });
});
