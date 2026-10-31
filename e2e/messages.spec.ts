import { expect, test } from "@playwright/test";
import { sendMessage, signUp, uniqueName } from "./helpers";

test.describe("send and read messages (T5.2)", () => {
  test("A sends a message; B sees it on their chat page; C can't see it", async ({ browser }) => {
    const [a, b, c] = [uniqueName("alice"), uniqueName("bob"), uniqueName("carol")];
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();
    const pageC = await browser.newPage();
    await signUp(pageA, a);
    await signUp(pageB, b);
    await signUp(pageC, c);

    await pageA.goto(`/u/${b}`);
    await pageA.getByRole("link", { name: "Message" }).click();
    await expect(pageA).toHaveURL(`/messages/${b}`);
    await sendMessage(pageA, "Hi! Want to build an app?");
    await expect(pageA.getByTestId("message").filter({ visible: true })).toHaveText([/Hi! Want to build an app\?/]);
    await expect(pageA.getByRole("textbox", { name: "Message" })).toHaveValue("");

    await pageB.goto(`/messages/${a}`);
    await expect(pageB.getByTestId("message").filter({ visible: true })).toHaveText([/Hi! Want to build an app\?/]);

    await pageC.goto(`/messages/${a}`);
    await expect(pageC.getByText(`No messages yet. Say hello to @${a}!`).filter({ visible: true })).toBeVisible();
    await expect(pageC.getByText("Hi! Want to build an app?")).toHaveCount(0);
  });

  test("an empty message shows an error and sends nothing", async ({ browser }) => {
    const [a, b] = [uniqueName("alice"), uniqueName("bob")];
    await signUp(await browser.newPage(), b);
    const page = await browser.newPage();
    await signUp(page, a);
    await page.goto(`/messages/${b}`);
    await sendMessage(page, "   ");
    await expect(page.getByRole("alert").filter({ hasText: "Write a message first." })).toBeVisible();
    await expect(page.getByTestId("message").filter({ visible: true })).toHaveCount(0);
  });
});
