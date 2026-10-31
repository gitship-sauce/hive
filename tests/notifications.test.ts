import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { follow, unfollow } from "@/lib/follows";
import { saveMessage } from "@/lib/messages";
import { getNotifications, getUnreadCount, markAllRead } from "@/lib/notifications";
import { notify } from "@/lib/notify";
import { makeUser } from "./helpers";

// The same steps the follow and message actions run.
async function followAndNotify(from: number, to: number) {
  const r = await follow(from, to);
  if (r.ok && r.created) await notify({ userId: to, type: "follow", actorId: from });
}

describe("save notifications (T6.1)", () => {
  it("following someone creates one notification for them", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    await followAndNotify(sammy, gitsy);
    expect((await getNotifications(gitsy)).map((n) => [n.type, n.actor, n.read])).toEqual([["follow", "sammy", false]]);
    expect(await getNotifications(sammy)).toEqual([]);
  });

  it("sending a message creates one notification for the recipient", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    const m = await saveMessage({ id: sammy, username: "sammy" }, { id: gitsy, username: "gitsy" }, "hi");
    await notify({ userId: gitsy, type: "message", actorId: sammy, messageId: m.id });
    expect((await getNotifications(gitsy)).map((n) => [n.type, n.actor])).toEqual([["message", "sammy"]]);
  });

  it("unfollowing doesn't notify, and follow-unfollow-follow notifies only once", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    await followAndNotify(sammy, gitsy);
    await unfollow(sammy, gitsy);
    await followAndNotify(sammy, gitsy);
    await followAndNotify(sammy, gitsy);
    expect(await db.select().from(notifications)).toHaveLength(1);
  });
});

describe("unread count and mark read (T6.2)", () => {
  it("counts unread, lists newest first, and mark-all-read sets the count to 0", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    const milo = await makeUser("milo");
    await followAndNotify(sammy, gitsy);
    await followAndNotify(milo, gitsy);
    expect(await getUnreadCount(gitsy)).toBe(2);
    expect((await getNotifications(gitsy)).map((n) => n.actor)).toEqual(["milo", "sammy"]);

    await markAllRead(gitsy);
    expect(await getUnreadCount(gitsy)).toBe(0);
    expect((await getNotifications(gitsy)).every((n) => n.read)).toBe(true);
  });

  it("marking my notifications read doesn't touch anyone else's", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    await followAndNotify(sammy, gitsy);
    await followAndNotify(gitsy, sammy);
    await markAllRead(gitsy);
    expect(await getUnreadCount(sammy)).toBe(1);
  });
});
