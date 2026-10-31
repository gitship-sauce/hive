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
