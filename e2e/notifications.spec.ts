import { expect, test, type Page } from "@playwright/test";
import { sendMessage, signUp, uniqueName, waitForLive } from "./helpers";

function unreadBadge(page: Page) {
  return page.getByTestId("unread-count").filter({ visible: true });
}

async function follow(page: Page, username: string) {
  await page.goto(`/u/${username}`);
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unfollow", exact: true })).toBeVisible();
}

test.describe("bell and notifications page (T6.2)", () => {
  test("the bell shows the unread count; opening the page lists them and marks them read", async ({ browser }) => {
    const [a, b] = [uniqueName("alice"), uniqueName("bob")];
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();
    await Promise.all([signUp(pageA, a), signUp(pageB, b)]);

    await follow(pageA, b);
    await pageA.goto(`/messages/${b}`);
    await sendMessage(pageA, "ping");
    await expect(pageA.getByTestId("message").filter({ visible: true })).toHaveCount(1);

    await pageB.goto("/");
    await expect(unreadBadge(pageB)).toHaveText("2");

    await pageB.getByRole("link", { name: "Notifications, 2 unread", exact: true }).click();
    const rows = pageB.getByTestId("notification").filter({ visible: true });
    await expect(rows).toHaveText([new RegExp(`@${a} sent you a message`), new RegExp(`@${a} followed you`)]);
    await expect(unreadBadge(pageB)).toHaveCount(0);

    await pageB.reload();
    await expect(unreadBadge(pageB)).toHaveCount(0);
    await expect(pageB.locator('[data-testid="notification"][data-unread]')).toHaveCount(0);
  });
});
