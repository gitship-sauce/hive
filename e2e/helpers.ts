import { expect, type Page } from "@playwright/test";

let counter = 0;
/** A username no other test uses, so tests don't depend on each other. */
export function uniqueName(prefix = "user") {
  counter += 1;
  return `${prefix}_${process.pid % 1000}_${counter}`.slice(0, 20);
}

export async function signUp(page: Page, username: string, password = "password123") {
  await page.goto("/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL("/");
}

export async function logIn(page: Page, username: string, password = "password123") {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

export async function sendMessage(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

/** Waits until the page's live connection to /ws is open. */
export async function waitForLive(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-realtime", "connected");
}
