import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";

/** Expects a username and password already checked by credentialsSchema. */
export async function createUser(username: string, password: string): Promise<Result<{ id: number }>> {
  const passwordHash = await hashPassword(password);
  try {
    const [row] = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id });
    return { ok: true, value: row };
  } catch (err) {
    // Checking "is it taken?" first would race with another sign-up; the unique index decides.
    if ((err as { cause?: { code?: string } }).cause?.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "That username is taken." };
    }
    throw err;
  }
}

export async function checkLogin(username: string, password: string): Promise<{ id: number } | null> {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username));
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return user && ok ? { id: user.id } : null;
}
