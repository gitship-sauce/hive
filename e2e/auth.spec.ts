import { expect, test } from "@playwright/test";
import { signUp, uniqueName } from "./helpers";

test.describe("sign up (T1.1)", () => {
  test("a new user signs up and lands on the feed, logged in", async ({ page }) => {
    const name = uniqueName("new");
    await signUp(page, name);
    await expect(page.getByRole("heading", { name: `Hello, @${name}`, exact: true })).toBeVisible();
  });

  test("a taken username shows an error", async ({ page, browser }) => {
    const name = uniqueName("taken");
    await signUp(page, name);

    const other = await browser.newPage();
    await other.goto("/signup");
    await other.getByLabel("Username").fill(name.toUpperCase());
    await other.getByLabel("Password").fill("password123");
    await other.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(other.locator("form").getByRole("alert")).toHaveText("That username is taken.");
    await expect(other).toHaveURL("/signup");
  });

  test("bad characters and a short password show errors", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Username").fill("bad name!");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Username must be 3–20 letters, numbers or _.");

    await page.getByLabel("Username").fill(uniqueName("short"));
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Password must be at least 8 characters.");
  });
});
