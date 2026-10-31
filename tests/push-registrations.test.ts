import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushRegistrations, sessions } from "@/db/schema";
import { getFirebaseWebConfig } from "@/lib/firebase-config";
import { getPushFids, savePushRegistration } from "@/lib/push-registrations";
import { createSession, deleteSession, hashToken } from "@/lib/sessions";
import { makeUser } from "./helpers";

async function login(username: string) {
  const id = await makeUser(username);
  const { token } = await createSession(id);
  return { id, token, sessionId: hashToken(token) };
}

describe("push registrations (T6.4)", () => {
  it("saves a browser's installation id for the logged-in user", async () => {
    const gitsy = await login("gitsy");
    await savePushRegistration("fid_browser_one", gitsy.id, gitsy.sessionId);
    expect(await getPushFids(gitsy.id)).toEqual(["fid_browser_one"]);
  });

  it("a new login on the same browser takes the installation id over", async () => {
    const gitsy = await login("gitsy");
    const sammy = await login("sammy");
    await savePushRegistration("fid_shared_pc", gitsy.id, gitsy.sessionId);
    await savePushRegistration("fid_shared_pc", sammy.id, sammy.sessionId);
    expect(await getPushFids(gitsy.id)).toEqual([]);
    expect(await getPushFids(sammy.id)).toEqual(["fid_shared_pc"]);
  });

  it("log out removes that browser's push, so the next person doesn't get my notifications", async () => {
    const gitsy = await login("gitsy");
    await savePushRegistration("fid_browser_one", gitsy.id, gitsy.sessionId);
    await deleteSession(gitsy.token);
    expect(await getPushFids(gitsy.id)).toEqual([]);
    expect(await db.select().from(pushRegistrations)).toEqual([]);
  });

  it("an expired login gets no push", async () => {
    const gitsy = await login("gitsy");
    await savePushRegistration("fid_browser_one", gitsy.id, gitsy.sessionId);
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.id, gitsy.sessionId));
    expect(await getPushFids(gitsy.id)).toEqual([]);
  });
});

describe("Firebase web config", () => {
  const keys = ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "MESSAGING_SENDER_ID", "APP_ID", "VAPID_KEY"].map((k) => `FIREBASE_${k}`);

  it("is off unless every value is set", () => {
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      for (const k of keys) process.env[k] = "x";
      expect(getFirebaseWebConfig()).not.toBeNull();
      delete process.env.FIREBASE_VAPID_KEY;
      expect(getFirebaseWebConfig()).toBeNull();
    } finally {
      for (const k of keys) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  });
});
