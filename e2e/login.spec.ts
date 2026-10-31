import { expect, test } from "@playwright/test";
import { logIn, signUp, uniqueName } from "./helpers";

test.describe("log in and log out (T1.2)", () => {
  test("the right password logs in; a wrong one shows an error", async ({ page, browser }) => {
    const name = uniqueName("login");
    await signUp(page, name);

    const other = await browser.newPage();
    await logIn(other, name, "not-the-password");
    await expect(other.locator("form").getByRole("alert")).toHaveText("Wrong username or password.");

    await logIn(other, name);
    await expect(other).toHaveURL("/");
    await expect(other.getByRole("heading", { name: `Hello, @${name}` })).toBeVisible();
  });

  test("log out ends the session, so the old cookie stops working", async ({ page, browser }) => {
    await signUp(page, uniqueName("logout"));
    const [oldCookie] = (await page.context().cookies()).filter((c) => c.name === "session");
    expect(oldCookie).toBeDefined();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");

    // Someone who copied the cookie before log out can't use it.
    const thief = await browser.newContext();
    await thief.addCookies([oldCookie]);
    const thiefPage = await thief.newPage();
    await thiefPage.goto("/");
    await expect(thiefPage).toHaveURL("/login");
    await thief.close();
  });
});
