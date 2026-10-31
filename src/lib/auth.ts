import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHub } from "./realtime";
import {
  createSession,
  deleteSession,
  getUserBySessionToken,
  hashToken,
  SESSION_COOKIE,
  type SessionUser,
} from "./sessions";

/** The logged-in user, read from the session cookie and checked against the database. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token);
}

/** The logged-in user, or a redirect to /login. Call it in every page and action that needs a login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function startSession(userId: number) {
  const { token, expiresAt } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // The app runs on http://localhost. Set COOKIE_SECURE=true when you serve it over HTTPS.
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
    getHub().closeSession(hashToken(token));
  }
  jar.delete(SESSION_COOKIE);
}
