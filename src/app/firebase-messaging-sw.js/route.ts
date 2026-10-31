import { connection } from "next/server";
import { getFirebaseWebConfig } from "@/lib/firebase-config";

// Firebase looks for its service worker at /firebase-messaging-sw.js. It runs in the background,
// even with every tab closed, and shows the notification when a push arrives.
export async function GET() {
  await connection(); // read the config on every request, not once at build time
  const config = getFirebaseWebConfig();
  if (!config) return new Response("Push notifications are not set up.", { status: 404 });

  const appConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };
  const script = `
// Handle clicks before Firebase loads, so Firebase doesn't replace this behaviour.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || data.url || "/";
  const url = new URL(path, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) if (tab.url === url && "focus" in tab) return tab.focus();
      return clients.openWindow(url);
    }),
  );
});

importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(appConfig)});
// With a "notification" in the message, Firebase shows it by itself when no tab is in front.
firebase.messaging();
`;
  return new Response(script, {
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
