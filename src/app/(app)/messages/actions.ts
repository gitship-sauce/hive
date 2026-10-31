"use server";

import { requireUser } from "@/lib/auth";
import { getUserIdByUsername } from "@/lib/follows";
import { saveMessage, type MessageView } from "@/lib/messages";
import { notify } from "@/lib/notify";
import { getHub } from "@/lib/realtime";
import { firstError, messageBodySchema, usernameSchema } from "@/lib/validation";

/** Short enough for a phone's notification. */
function preview(text: string) {
  const chars = [...text];
  return chars.length > 100 ? `${chars.slice(0, 99).join("")}…` : text;
}

export type SendResult = { ok: true; message: MessageView } | { ok: false; error: string };

export async function sendMessage(toUsername: string, formData: FormData): Promise<SendResult> {
  const me = await requireUser();

  const to = usernameSchema.safeParse(toUsername);
  const toId = to.success ? await getUserIdByUsername(to.data) : null;
  if (toId === null || !to.success) return { ok: false, error: "That user doesn't exist." };
  if (toId === me.id) return { ok: false, error: "You can't message yourself." };

  const body = messageBodySchema.safeParse(String(formData.get("body") ?? ""));
  if (!body.success) return { ok: false, error: firstError(body.error) };

  // Saved first, then pushed: if the push fails, the message is still there on the next page load.
  const message = await saveMessage(me, { id: toId, username: to.data }, body.data);
  const hub = getHub();
  hub.sendToUser(toId, { type: "message", message });
  hub.sendToUser(me.id, { type: "message", message }); // my other open tabs
  await notify(
    { userId: toId, type: "message", actorId: me.id, messageId: message.id },
    { title: `@${me.username}`, body: preview(message.body), url: `/messages/${me.username}` },
  );
  return { ok: true, message };
}
