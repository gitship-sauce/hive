import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("follow and unfollow (T3.2)", () => {
  test("follow puts their posts in my feed and counts go up; unfollow undoes it", async ({ page, browser }) => {
    const author = uniqueName("author");
    const authorPage = await browser.newPage();
    await signUp(authorPage, author);
    await authorPage.getByLabel("What's happening?").fill("Post by the author");
    await authorPage.getByRole("button", { name: "Post" }).click();
    await expect(authorPage.getByTestId("post")).toHaveCount(1);

    await signUp(page, uniqueName("fan"));
    await expect(page.getByTestId("post")).toHaveCount(0);

    await page.goto(`/u/${author}`);
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(page.getByRole("button", { name: "Unfollow" })).toBeVisible();
    await expect(page.getByTestId("followers")).toHaveText("1");

    await page.goto("/");
    await expect(page.getByTestId("post")).toContainText("Post by the author");

    await page.goto(`/u/${author}`);
    await page.getByRole("button", { name: "Unfollow" }).click();
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(page.getByTestId("followers")).toHaveText("0");

    await page.goto("/");
    await expect(page.getByTestId("post")).toHaveCount(0);
  });

  test("my own profile has no Follow button", async ({ page }) => {
    const me = uniqueName("me");
    await signUp(page, me);
    await page.goto(`/u/${me}`);
    await expect(page.getByText("This is you.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Follow" })).toHaveCount(0);
  });
});
