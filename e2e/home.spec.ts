import { expect, test } from "@playwright/test";

test("the home page opens", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
});
