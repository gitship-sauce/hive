import { expect, test } from "@playwright/test";
import { sendMessage, signUp, uniqueName, waitForLive } from "./helpers";

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

test.describe("messages arrive live (T5.3)", () => {
  test("A's message shows up in B's open window without a refresh; C gets nothing", async ({ browser }) => {
    const [a, b, c] = [uniqueName("alice"), uniqueName("bob"), uniqueName("carol")];
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();
    const pageC = await browser.newPage();
    await Promise.all([signUp(pageA, a), signUp(pageB, b), signUp(pageC, c)]);

    // C listens on the socket for anything at all.
    const cFrames: string[] = [];
    pageC.on("websocket", (ws) => ws.on("framereceived", (f) => cFrames.push(String(f.payload))));
    await pageC.goto(`/messages/${a}`);

    await pageB.goto(`/messages/${a}`);
    await pageA.goto(`/messages/${b}`);
    await waitForLive(pageB);

    let reloads = 0;
    pageB.on("load", () => reloads++);
    await sendMessage(pageA, "Live hello!");

    await expect(pageB.getByTestId("message").filter({ visible: true })).toHaveText([/Live hello!/]);
    expect(reloads).toBe(0);
    // C's socket would have had it by now if the server sent it to the wrong person.
    await sendMessage(pageA, "Second hello");
    await expect(pageB.getByTestId("message").filter({ visible: true })).toHaveCount(2);
    expect(cFrames.join("")).not.toContain("hello");
  });

  test("a message I send shows once in my other open tab too", async ({ browser }) => {
    const [a, b] = [uniqueName("alice"), uniqueName("bob")];
    await signUp(await browser.newPage(), b);
    const context = await browser.newContext();
    const tab1 = await context.newPage();
    await signUp(tab1, a);
    const tab2 = await context.newPage();
    await tab2.goto(`/messages/${b}`);
    await tab1.goto(`/messages/${b}`);
    await expect(tab2.getByText(`No messages yet. Say hello to @${b}!`).filter({ visible: true })).toBeVisible();

    await sendMessage(tab1, "From tab one");
    await expect(tab2.getByTestId("message").filter({ visible: true })).toHaveText([/From tab one/]);
    await expect(tab1.getByTestId("message").filter({ visible: true })).toHaveText([/From tab one/]);
    await context.close();
  });
});

test("a message sent while B was offline appears when B's connection comes back", async ({ browser }) => {
  const [a, b] = [uniqueName("alice"), uniqueName("bob")];
  const pageA = await browser.newPage();
  const pageB = await browser.newPage();
  await Promise.all([signUp(pageA, a), signUp(pageB, b)]);

  // Sit between B and the server, so the test can cut B's live connection.
  let cut: (() => Promise<void>) | undefined;
  await pageB.routeWebSocket(/\/ws$/, (ws) => {
    const server = ws.connectToServer();
    cut = () => server.close({ code: 1006 }).then(() => ws.close({ code: 1001 }));
  });

  await pageB.goto(`/messages/${a}`);
  await waitForLive(pageB);
  await cut!();
  await expect(pageB.locator("html")).toHaveAttribute("data-realtime", "disconnected");

  await pageA.goto(`/messages/${b}`);
  await sendMessage(pageA, "Sent while you were offline");
  await expect(pageA.getByTestId("message").filter({ visible: true })).toHaveCount(1);

  // B reconnects on its own (after about a second) and loads what it missed.
  await waitForLive(pageB);
  await expect(pageB.getByTestId("message").filter({ visible: true })).toHaveText([/Sent while you were offline/]);
});

test("the conversation list shows the latest message and updates live (T5.4)", async ({ browser }) => {
  const [a, b] = [uniqueName("alice"), uniqueName("bob")];
  const pageA = await browser.newPage();
  const pageB = await browser.newPage();
  await Promise.all([signUp(pageA, a), signUp(pageB, b)]);

  await pageB.getByRole("link", { name: "Messages" }).click();
  await expect(pageB.getByText("No conversations yet.", { exact: false }).filter({ visible: true })).toBeVisible();
  await waitForLive(pageB);

  await pageA.goto(`/messages/${b}`);
  await sendMessage(pageA, "Are you there?");

  const row = pageB.getByTestId("conversation").filter({ visible: true });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(`@${a}`);
  await expect(row).toContainText("Are you there?");
  await row.click();
  await expect(pageB).toHaveURL(`/messages/${a}`);
});
