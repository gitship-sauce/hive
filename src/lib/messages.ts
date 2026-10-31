import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";

export type MessageView = { id: number; from: string; to: string; body: string; createdAt: string };

type Person = { id: number; username: string };

/** Expects a body already checked by messageBodySchema. */
export async function saveMessage(sender: Person, recipient: Person, body: string): Promise<MessageView> {
  if (sender.id === recipient.id) throw new Error("Can't message yourself");
  const [row] = await db
    .insert(messages)
    .values({ senderId: sender.id, recipientId: recipient.id, body })
    .returning();
  return { id: row.id, from: sender.username, to: recipient.username, body: row.body, createdAt: row.createdAt.toISOString() };
}

/** The last messages between two people, oldest first. Only ever their two ids are used. */
export async function getConversation(me: Person, other: Person, limit = 100): Promise<MessageView[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, me.id), eq(messages.recipientId, other.id)),
        and(eq(messages.senderId, other.id), eq(messages.recipientId, me.id)),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit);

  const name = (id: number) => (id === me.id ? me.username : other.username);
  return rows.reverse().map((m) => ({
    id: m.id,
    from: name(m.senderId),
    to: name(m.recipientId),
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}
