import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("search users (T4.1)", () => {
  test("typing part of a username lists matching users and links to them", async ({ page, browser }) => {
    const target = uniqueName("findme");
    await signUp(await browser.newPage(), target);

    await signUp(page, uniqueName("seeker"));
    await page.getByRole("link", { name: "Search" }).click();
    const box = page.getByRole("searchbox", { name: "Search by username" });
    await box.fill(target.slice(0, 8).toUpperCase());
    await box.press("Enter");
    await expect(page.getByRole("link", { name: `@${target}` })).toBeVisible();

    await page.getByRole("link", { name: `@${target}` }).click();
    await expect(page.getByRole("heading", { name: `@${target}` })).toBeVisible();
  });

  test("% is searched as plain text and finds nobody", async ({ page }) => {
    await signUp(page, uniqueName("seeker"));
    await page.goto("/search?q=%25");
    await expect(page.getByText("Nobody found for “%”.").filter({ visible: true })).toBeVisible();
    await expect(page.getByTestId("search-result").filter({ visible: true })).toHaveCount(0);
  });
});
