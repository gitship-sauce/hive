import { createNotification, type NotificationInput } from "./notifications";

/** Saves a notification for someone. The one place every "X did something to you" goes through. */
export async function notify(input: NotificationInput) {
  return createNotification(input);
}
