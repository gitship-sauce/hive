import { readFileSync } from "node:fs";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";
import { deletePushRegistration, getPushFids } from "./push-registrations";

export type PushContent = { title: string; body: string; url: string };

/** The one Firebase call we use, so tests can pass a fake. */
export type PushSender = { send(message: Message): Promise<string> };

// Firebase's answer when a browser's installation id is gone (site data cleared, notifications revoked…).
const GONE = new Set(["messaging/installation-id-not-registered", "messaging/registration-token-not-registered"]);

/** Sends one push to every browser where the user turned push on. Dead installation ids are deleted. */
export async function sendPushWith(sender: PushSender, userId: number, content: PushContent) {
  const fids = await getPushFids(userId);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    fids.map(async (fid) => {
      try {
        await sender.send({
          fid,
          // "notification" makes Firebase show it by itself; "data.url" is where a click goes.
          notification: { title: content.title, body: content.body },
          data: { url: content.url },
        });
        sent++;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code && GONE.has(code)) {
          await deletePushRegistration(fid);
          removed++;
        } else {
          console.error(`Push to user ${userId} failed`, err);
        }
      }
    }),
  );
  return { sent, removed };
}

const APP_NAME = "hive-push";
let warned = false;

/** Firebase Admin, or null when push is off because no service account is set. */
function getSender(): PushSender | null {
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (!file) {
    if (!warned) {
      console.warn("Push notifications are off: FIREBASE_SERVICE_ACCOUNT_FILE is not set. See README.");
      warned = true;
    }
    return null;
  }
  const app = getApps().some((a) => a.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp({ credential: cert(JSON.parse(readFileSync(file, "utf8"))) }, APP_NAME);
  return getMessaging(app);
}

/** Sends a push in the background. Never throws: a failed push must not fail the follow or message. */
export function queuePush(userId: number, content: PushContent) {
  let sender: PushSender | null;
  try {
    sender = getSender();
  } catch (err) {
    console.error("Firebase Admin couldn't start; check FIREBASE_SERVICE_ACCOUNT_FILE", err);
    return Promise.resolve(null);
  }
  if (!sender) return Promise.resolve(null);
  return sendPushWith(sender, userId, content).catch((err) => {
    console.error(`Push to user ${userId} failed`, err);
    return null;
  });
}
