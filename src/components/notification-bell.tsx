"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "@/app/(app)/notifications/actions";
import { useRealtime } from "./realtime-provider";

export function NotificationBell({ initial }: { initial: number }) {
  const [unread, setUnread] = useState(initial);
  const { subscribe, connections } = useRealtime();

  // A page refresh brings a new count from the server.
  const [seenInitial, setSeenInitial] = useState(initial);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setUnread(initial);
  }

  useEffect(() => subscribe((e) => e.type === "notifications" && setUnread(e.unread)), [subscribe]);

  // Anything that happened while the socket was down: ask once after every (re)connect.
  useEffect(() => {
    if (connections === 0) return;
    let current = true;
    fetchUnreadCount()
      .then((n) => current && setUnread(n))
      .catch((err) => console.error("Couldn't load the unread count", err));
    return () => {
      current = false;
    };
  }, [connections]);

  const label = unread === 0 ? "Notifications" : `Notifications, ${unread} unread`;
  return (
    <Link href="/notifications" aria-label={label} className="relative p-1 hover:text-amber-600">
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span
          data-testid="unread-count"
          className="absolute -right-1.5 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
