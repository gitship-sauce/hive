import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

export type NotificationInput = {
  userId: number;
  type: "follow" | "message";
  actorId: number;
  messageId?: number;
};

export type NotificationView = {
  id: number;
  type: "follow" | "message";
  actor: string;
  createdAt: string;
  read: boolean;
};

/** Saves a notification. Returns null if it already existed (a second "followed you"). */
export async function createNotification(input: NotificationInput) {
  const [row] = await db
    .insert(notifications)
    .values({ ...input, messageId: input.messageId ?? null })
    .onConflictDoNothing()
    .returning({ id: notifications.id });
  return row ?? null;
}

export async function getUnreadCount(userId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row.n;
}

export async function getNotifications(userId: number, limit = 50): Promise<NotificationView[]> {
  const actor = alias(users, "actor");
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      actor: actor.username,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .innerJoin(actor, eq(actor.id, notifications.actorId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    actor: r.actor,
    createdAt: r.createdAt.toISOString(),
    read: r.readAt !== null,
  }));
}

export async function markAllRead(userId: number) {
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
