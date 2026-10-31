import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { follows, users } from "@/db/schema";

export type Profile = {
  id: number;
  username: string;
  followers: number;
  following: number;
  /** Does the viewer follow this user? */
  followedByViewer: boolean;
};

export async function getUserIdByUsername(username: string): Promise<number | null> {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  return row?.id ?? null;
}

export async function getProfile(username: string, viewerId: number): Promise<Profile | null> {
  const id = await getUserIdByUsername(username);
  if (id === null) return null;

  const [[followers], [following], [viewerRow]] = await Promise.all([
    db.select({ n: count() }).from(follows).where(eq(follows.followingId, id)),
    db.select({ n: count() }).from(follows).where(eq(follows.followerId, id)),
    db
      .select({ n: count() })
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, id))),
  ]);

  return { id, username, followers: followers.n, following: following.n, followedByViewer: viewerRow.n > 0 };
}

export type FollowResult = { ok: true; created: boolean } | { ok: false; error: string };

/** `created` is false when the viewer already followed them, so callers can skip a second notification. */
export async function follow(followerId: number, followingId: number): Promise<FollowResult> {
  if (followerId === followingId) return { ok: false, error: "You can't follow yourself." };
  const inserted = await db
    .insert(follows)
    .values({ followerId, followingId })
    .onConflictDoNothing()
    .returning({ followerId: follows.followerId });
  return { ok: true, created: inserted.length > 0 };
}

export async function unfollow(followerId: number, followingId: number) {
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}
