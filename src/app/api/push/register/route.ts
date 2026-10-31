import { cookies } from "next/headers";
import { z } from "zod";
import { savePushRegistration } from "@/lib/push-registrations";
import { getUserBySessionToken, hashToken, SESSION_COOKIE } from "@/lib/sessions";

// Firebase Installation IDs are short URL-safe strings (22 characters today).
const bodySchema = z.object({ fid: z.string().regex(/^[A-Za-z0-9_-]{10,200}$/) });

export async function POST(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserBySessionToken(token);
  if (!user || !token) return Response.json({ error: "Log in first." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid installation id." }, { status: 400 });

  await savePushRegistration(parsed.data.fid, user.id, hashToken(token));
  return new Response(null, { status: 204 });
}
