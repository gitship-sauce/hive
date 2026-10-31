"use server";

import { requireUser } from "@/lib/auth";
import { getUnreadCount, markAllRead } from "@/lib/notifications";
import { getHub } from "@/lib/realtime";

/** Called by the page after it has been shown, never during rendering (a prefetch would count as "seen"). */
export async function markNotificationsRead() {
  const me = await requireUser();
  await markAllRead(me.id);
  getHub().sendToUser(me.id, { type: "notifications", unread: 0 }); // the bell in my other tabs
}

export async function fetchUnreadCount() {
  const me = await requireUser();
  return getUnreadCount(me.id);
}
