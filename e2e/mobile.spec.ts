import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

// 360 px is the narrowest common phone width.
test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

test("on a phone every page fits the screen and Log out is reachable", async ({ page }) => {
  const me = uniqueName("phone_user_long");
  await signUp(page, me);
  for (const path of ["/", "/search?q=phone", "/messages", "/notifications", `/u/${me}`]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeInViewport();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(sideways, `${path} scrolls sideways`).toBe(false);
  }
  await page.getByRole("link", { name: "Me", exact: true }).click();
  await expect(page).toHaveURL(`/u/${me}`);
});
