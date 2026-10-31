import { asc, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/** Makes % and _ (and the escape character itself) match literally in a LIKE pattern. */
export function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Users whose name contains the text, exact match first, then names starting with it. */
export async function searchUsers(text: string, limit = 20) {
  const q = text.trim().toLowerCase();
  if (!q) return [];
  const escaped = escapeLike(q);

  return db
    .select({ username: users.username })
    .from(users)
    .where(ilike(users.username, `%${escaped}%`))
    .orderBy(
      sql`case when ${users.username} = ${q} then 0 when ${users.username} like ${`${escaped}%`} then 1 else 2 end`,
      asc(users.username),
    )
    .limit(limit);
}
