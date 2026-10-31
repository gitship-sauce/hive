import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { pushRegistrations, sessions } from "@/db/schema";

/** Links one browser (its Firebase Installation ID) to a login. A new login on the same browser takes it over. */
export async function savePushRegistration(fid: string, userId: number, sessionId: string) {
  await db
    .insert(pushRegistrations)
    .values({ fid, userId, sessionId })
    .onConflictDoUpdate({
      target: pushRegistrations.fid,
      set: { userId, sessionId, createdAt: sql`now()` },
    });
}

/** The browsers to push to: only those whose login is still valid. */
export async function getPushFids(userId: number): Promise<string[]> {
  const rows = await db
    .select({ fid: pushRegistrations.fid })
    .from(pushRegistrations)
    .innerJoin(sessions, eq(sessions.id, pushRegistrations.sessionId))
    .where(and(eq(pushRegistrations.userId, userId), gt(sessions.expiresAt, sql`now()`)));
  return rows.map((r) => r.fid);
}

export async function deletePushRegistration(fid: string) {
  await db.delete(pushRegistrations).where(eq(pushRegistrations.fid, fid));
}
