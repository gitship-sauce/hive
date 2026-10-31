"use client";

import { initializeApp, getApps } from "@firebase/app";
import { getMessaging, isSupported, onRegistered, register } from "@firebase/messaging";
import { useEffect, useState } from "react";
import type { FirebaseWebConfig } from "@/lib/firebase-config";

type Status = "checking" | "unsupported" | "off" | "working" | "on" | "blocked" | "error";

async function sendFidToServer(fid: string) {
  const res = await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fid }),
  });
  if (!res.ok) throw new Error(`Saving the push registration failed (${res.status})`);
}

/** Registers this browser with Firebase and tells our server its installation id. */
async function enablePush(config: FirebaseWebConfig) {
  const { vapidKey, ...appConfig } = config;
  const app = getApps()[0] ?? initializeApp(appConfig);
  const messaging = getMessaging(app);
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const saved = new Promise<void>((resolve, reject) => {
    // Also fires later if Firebase rotates the id; the server then gets the new one.
    onRegistered(messaging, (fid) => sendFidToServer(fid).then(resolve, reject));
  });
  await register(messaging, { vapidKey, serviceWorkerRegistration });
  await saved;
}

export function PushToggle({ config }: { config: FirebaseWebConfig }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let current = true;
    (async () => {
      const supported = "Notification" in window && "serviceWorker" in navigator && (await isSupported());
      if (!current) return;
      if (!supported) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("blocked");
      if (Notification.permission !== "granted") return setStatus("off");
      // Already allowed: link this browser to the current login without asking again.
      setStatus("working");
      await enablePush(config);
      if (current) setStatus("on");
    })().catch((err) => {
      console.error("Push setup failed", err);
      if (current) setStatus("error");
    });
    return () => {
      current = false;
    };
  }, [config]);

  async function turnOn() {
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus(permission === "denied" ? "blocked" : "off");
      await enablePush(config);
      setStatus("on");
    } catch (err) {
      console.error("Push setup failed", err);
      setStatus("error");
    }
  }

  const text: Record<Status, string> = {
    checking: "",
    unsupported: "This browser can't show push notifications.",
    off: "Get a notification even when Hive is closed.",
    working: "Turning on…",
    on: "Push notifications are on for this browser.",
    blocked: "Notifications are blocked. Allow them in your browser's site settings.",
    error: "Couldn't turn on push notifications. Try again.",
  };

  return (
    <div data-testid="push-toggle" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <span className="text-neutral-600 dark:text-neutral-400">{text[status]}</span>
      {(status === "off" || status === "error") && (
        <button
          type="button"
          onClick={turnOn}
          className="shrink-0 rounded-full bg-amber-500 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Turn on notifications
        </button>
      )}
    </div>
  );
}
