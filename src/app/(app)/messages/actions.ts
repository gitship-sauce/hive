"use server";

import { requireUser } from "@/lib/auth";
import { getUserIdByUsername } from "@/lib/follows";
import { saveMessage, type MessageView } from "@/lib/messages";
import { firstError, messageBodySchema, usernameSchema } from "@/lib/validation";

export type SendResult = { ok: true; message: MessageView } | { ok: false; error: string };

export async function sendMessage(toUsername: string, formData: FormData): Promise<SendResult> {
  const me = await requireUser();

  const to = usernameSchema.safeParse(toUsername);
  const toId = to.success ? await getUserIdByUsername(to.data) : null;
  if (toId === null || !to.success) return { ok: false, error: "That user doesn't exist." };
  if (toId === me.id) return { ok: false, error: "You can't message yourself." };

  const body = messageBodySchema.safeParse(String(formData.get("body") ?? ""));
  if (!body.success) return { ok: false, error: firstError(body.error) };

  const message = await saveMessage(me, { id: toId, username: to.data }, body.data);
  return { ok: true, message };
}
