import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { follows } from "@/db/schema";
import { getProfile } from "@/lib/follows";
import { makeUser } from "./helpers";

describe("profile (T3.1)", () => {
  it("counts followers and following, and whether the viewer follows", async () => {
    const gitsy = await makeUser("gitsy");
    const sammy = await makeUser("sammy");
    const milo = await makeUser("milo");
    await db.insert(follows).values([
      { followerId: sammy, followingId: gitsy },
      { followerId: milo, followingId: gitsy },
      { followerId: gitsy, followingId: sammy },
    ]);

    expect(await getProfile("gitsy", sammy)).toEqual({
      id: gitsy,
      username: "gitsy",
      followers: 2,
      following: 1,
      followedByViewer: true,
    });
    expect((await getProfile("gitsy", gitsy))?.followedByViewer).toBe(false);
  });

  it("returns null for an unknown username", async () => {
    const viewer = await makeUser("gitsy");
    expect(await getProfile("nobody", viewer)).toBeNull();
  });
});
