import { createNotification, getUnreadCount, type NotificationInput } from "./notifications";
import { queuePush, type PushContent } from "./push";
import { getHub } from "./realtime";

/**
 * Saves a notification for someone, updates the bell in their open tabs,
 * and sends a push to browsers where they turned push on.
 * The one place every "X did something to you" goes through.
 */
export async function notify(input: NotificationInput, push: PushContent) {
  const created = await createNotification(input);
  if (!created) return null;

  const unread = await getUnreadCount(input.userId);
  getHub().sendToUser(input.userId, { type: "notifications", unread });
  void queuePush(input.userId, push);
  return created;
}
