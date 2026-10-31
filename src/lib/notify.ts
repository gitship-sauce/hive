import { createNotification, getUnreadCount, type NotificationInput } from "./notifications";
import { getHub } from "./realtime";

/**
 * Saves a notification for someone and updates the bell in their open tabs.
 * The one place every "X did something to you" goes through.
 */
export async function notify(input: NotificationInput) {
  const created = await createNotification(input);
  if (!created) return null;

  const unread = await getUnreadCount(input.userId);
  getHub().sendToUser(input.userId, { type: "notifications", unread });
  return created;
}
