import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { follows } from "@/db/schema";
import { follow, getProfile, unfollow } from "@/lib/follows";
import { makeUser } from "./helpers";

describe("follow and unfollow (T3.2)", () => {
  it("follow adds one row and the counts go up; unfollow removes it", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");

    expect(await follow(sammy, gitsy)).toEqual({ ok: true, created: true });
    expect((await getProfile("gitsy", sammy))?.followers).toBe(1);
    expect((await getProfile("sammy", sammy))?.following).toBe(1);

    await unfollow(sammy, gitsy);
    expect((await getProfile("gitsy", sammy))?.followers).toBe(0);
    expect(await db.select().from(follows)).toEqual([]);
  });

  it("following twice still gives one row", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    await follow(sammy, gitsy);
    expect(await follow(sammy, gitsy)).toEqual({ ok: true, created: false });
    expect(await db.select().from(follows)).toHaveLength(1);
  });

  it("two follows at the same moment still give one row", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    const results = await Promise.all([follow(sammy, gitsy), follow(sammy, gitsy)]);
    expect(results.filter((r) => r.ok && r.created)).toHaveLength(1);
    expect(await db.select().from(follows)).toHaveLength(1);
  });

  it("you can't follow yourself, in the app or in the database", async () => {
    const gitsy = await makeUser("gitsy");
    expect(await follow(gitsy, gitsy)).toEqual({ ok: false, error: "You can't follow yourself." });
    await expect(db.insert(follows).values({ followerId: gitsy, followingId: gitsy })).rejects.toThrow();
  });

  it("unfollowing someone you don't follow does nothing", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    await expect(unfollow(sammy, gitsy)).resolves.toBeUndefined();
  });
});
