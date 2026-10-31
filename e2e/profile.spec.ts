import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("profile page (T3.1)", () => {
  test("shows the user's posts and follower and following counts", async ({ page, browser }) => {
    const author = uniqueName("author");
    const authorPage = await browser.newPage();
    await signUp(authorPage, author);
    await authorPage.getByLabel("What's happening?").fill("Hello from my profile");
    await authorPage.getByRole("button", { name: "Post" }).click();
    await expect(authorPage.getByTestId("post").filter({ visible: true })).toHaveCount(1);

    await signUp(page, uniqueName("visitor"));
    await page.goto(`/u/${author}`);
    await expect(page.getByRole("heading", { name: `@${author}` })).toBeVisible();
    await expect(page.getByTestId("followers").filter({ visible: true })).toHaveText("0");
    await expect(page.getByTestId("following").filter({ visible: true })).toHaveText("0");
    await expect(page.getByTestId("post").filter({ visible: true })).toContainText("Hello from my profile");
  });

  test("an unknown username shows User not found", async ({ page }) => {
    await signUp(page, uniqueName("visitor"));
    await page.goto("/u/nobody_by_this_name");
    await expect(page.getByRole("heading", { name: "User not found" })).toBeVisible();
    // The page streams, so the status is already 200 (F5); Next.js tells search engines to skip it instead.
    await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  });
});
