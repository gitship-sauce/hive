import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { follows, posts, users } from "@/db/schema";

export type PostView = { id: number; body: string; createdAt: Date; author: string };

/** Expects a body already checked by postBodySchema. */
export async function createPost(authorId: number, body: string) {
  const [row] = await db.insert(posts).values({ authorId, body }).returning({ id: posts.id });
  return row;
}

export async function getPostsByAuthor(authorId: number, limit = 50): Promise<PostView[]> {
  return db
    .select({ id: posts.id, body: posts.body, createdAt: posts.createdAt, author: users.username })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.authorId, authorId))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
}

/** My posts and the posts of people I follow, newest first. */
export async function getFeed(userId: number, limit = 50): Promise<PostView[]> {
  const followed = db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  return db
    .select({ id: posts.id, body: posts.body, createdAt: posts.createdAt, author: users.username })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(or(eq(posts.authorId, userId), inArray(posts.authorId, followed)))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
}
