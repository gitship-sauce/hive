import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { follows, posts } from "@/db/schema";
import { createPost, getFeed, getPostsByAuthor } from "@/lib/posts";
import { firstError, postBodySchema } from "@/lib/validation";
import { makeUser } from "./helpers";

describe("write a post (T2.1)", () => {
  it("saves a post for its author", async () => {
    const id = await makeUser("gitsy");
    await createPost(id, "hello hive");
    const mine = await getPostsByAuthor(id);
    expect(mine.map((p) => [p.author, p.body])).toEqual([["gitsy", "hello hive"]]);
  });

  it.each(["", "   ", "\n\n"])("rejects an empty post %j", (body) => {
    const parsed = postBodySchema.safeParse(body);
    expect(parsed.success).toBe(false);
    expect(firstError(parsed.error!)).toBe("Write something first.");
  });

  it("accepts 280 characters and rejects 281", () => {
    expect(postBodySchema.safeParse("a".repeat(280)).success).toBe(true);
    const parsed = postBodySchema.safeParse("a".repeat(281));
    expect(firstError(parsed.error!)).toBe("Posts can be up to 280 characters.");
  });

  it("counts an emoji as one character, the same as the database", async () => {
    const body = "🐝".repeat(280);
    expect(postBodySchema.safeParse(body).success).toBe(true);
    const id = await makeUser("gitsy");
    await expect(createPost(id, body)).resolves.toBeDefined();
  });

  it("the database refuses a too-long post even if the app check is skipped", async () => {
    const id = await makeUser("gitsy");
    await expect(db.insert(posts).values({ authorId: id, body: "a".repeat(281) })).rejects.toThrow();
    await expect(db.insert(posts).values({ authorId: id, body: "" })).rejects.toThrow();
  });
});

describe("the feed (T2.2)", () => {
  it("shows my posts and posts of people I follow, newest first, and nobody else's", async () => {
    const me = await makeUser("gitsy");
    const friend = await makeUser("sammy");
    const stranger = await makeUser("stranger");
    await db.insert(follows).values({ followerId: me, followingId: friend });

    await createPost(friend, "friend 1");
    await createPost(me, "mine 1");
    await createPost(stranger, "stranger 1");
    await createPost(friend, "friend 2");

    const feed = await getFeed(me);
    expect(feed.map((p) => p.body)).toEqual(["friend 2", "mine 1", "friend 1"]);
  });

  it("following me doesn't put their posts in my feed", async () => {
    const me = await makeUser("gitsy");
    const fan = await makeUser("fan");
    await db.insert(follows).values({ followerId: fan, followingId: me });
    await createPost(fan, "fan post");
    expect(await getFeed(me)).toEqual([]);
  });

  it("orders posts made in the same instant by newest id", async () => {
    const me = await makeUser("gitsy");
    const at = new Date("2026-01-01T00:00:00Z");
    await db.insert(posts).values([
      { authorId: me, body: "first", createdAt: at },
      { authorId: me, body: "second", createdAt: at },
    ]);
    expect((await getFeed(me)).map((p) => p.body)).toEqual(["second", "first"]);
  });
});
