import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("write a post (T2.1)", () => {
  test("a post appears on the feed", async ({ page }) => {
    await signUp(page, uniqueName("poster"));
    await page.getByLabel("What's happening?").fill("My first post on Hive");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.getByTestId("post").filter({ visible: true }).first()).toContainText("My first post on Hive");
    await expect(page.getByLabel("What's happening?")).toHaveValue("");
  });

  test("an empty or too-long post shows an error and saves nothing", async ({ page }) => {
    await signUp(page, uniqueName("poster"));
    await page.getByLabel("What's happening?").fill("   ");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Write something first.");

    await page.getByLabel("What's happening?").fill("a".repeat(281));
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Posts can be up to 280 characters.");
    await expect(page.getByTestId("post").filter({ visible: true })).toHaveCount(0);
  });
});

test("after a too-long post fails, the counter matches the text that is still there (F20)", async ({ page }) => {
  await signUp(page, uniqueName("poster"));
  await page.getByLabel("What's happening?").fill("a".repeat(281));
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Posts can be up to 280 characters.");
  await expect(page.getByLabel("What's happening?")).toHaveValue("a".repeat(281));
  await expect(page.getByText("281/280", { exact: true })).toBeVisible();
});
