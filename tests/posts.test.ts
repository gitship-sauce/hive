import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { createPost, getPostsByAuthor } from "@/lib/posts";
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
