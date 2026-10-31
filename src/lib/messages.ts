import { and, desc, eq, or, sql } from "drizzle-orm";
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

export type ConversationView = { with: string; lastBody: string; lastFromMe: boolean; lastAt: string };

/** Everyone I've messaged or who messaged me, newest conversation first, with the last message. */
export async function getConversations(me: number, limit = 50): Promise<ConversationView[]> {
  const result = await db.execute<{
    with: string;
    body: string;
    sender_id: number;
    created_at: Date | string;
  }>(sql`
    select u.username as with, last.body, last.sender_id, last.created_at
    from (
      select distinct on (other_id) other_id, id, body, sender_id, created_at
      from (
        select m.*, case when m.sender_id = ${me} then m.recipient_id else m.sender_id end as other_id
        from messages m
        where m.sender_id = ${me} or m.recipient_id = ${me}
      ) mine
      order by other_id, created_at desc, id desc
    ) last
    join users u on u.id = last.other_id
    order by last.created_at desc, last.id desc
    limit ${limit}
  `);

  return result.rows.map((r) => ({
    with: r.with,
    lastBody: r.body,
    lastFromMe: r.sender_id === me,
    lastAt: new Date(r.created_at).toISOString(),
  }));
}
