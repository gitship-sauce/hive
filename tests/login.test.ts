import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { createSession, deleteSession, getUserBySessionToken } from "@/lib/sessions";
import { checkLogin, createUser } from "@/lib/users";

async function makeUser(username = "gitsy", password = "password123") {
  const created = await createUser(username, password);
  if (!created.ok) throw new Error(created.error);
  return created.value.id;
}

describe("log in and log out (T1.2)", () => {
  it("accepts the right password", async () => {
    const id = await makeUser();
    expect(await checkLogin("gitsy", "password123")).toEqual({ id });
  });

  it("refuses a wrong password and an unknown username", async () => {
    await makeUser();
    expect(await checkLogin("gitsy", "wrong-password")).toBeNull();
    expect(await checkLogin("nobody", "password123")).toBeNull();
  });

  it("a session token finds its user, and stops working after log out", async () => {
    const id = await makeUser();
    const { token } = await createSession(id);
    expect(await getUserBySessionToken(token)).toEqual({ id, username: "gitsy" });

    await deleteSession(token);
    expect(await getUserBySessionToken(token)).toBeNull();
  });

  it("stores a hash of the token, not the token", async () => {
    const id = await makeUser();
    const { token } = await createSession(id);
    const rows = await db.select().from(sessions).where(eq(sessions.userId, id));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).not.toBe(token);
  });

  it("an expired session doesn't log anyone in", async () => {
    const id = await makeUser();
    const { token } = await createSession(id);
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.userId, id));
    expect(await getUserBySessionToken(token)).toBeNull();
  });

  it("an unknown or missing token doesn't log anyone in", async () => {
    expect(await getUserBySessionToken("made-up-token")).toBeNull();
    expect(await getUserBySessionToken(undefined)).toBeNull();
  });
});
