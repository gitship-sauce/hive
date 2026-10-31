"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRealtime } from "./realtime-provider";

/** Re-loads the page's server data when a message arrives, so the list stays current. */
export function RefreshOnMessage() {
  const { subscribe, connections } = useRealtime();
  const router = useRouter();

  useEffect(() => subscribe((e) => e.type === "message" && router.refresh()), [subscribe, router]);
  useEffect(() => {
    // Also after the first connect: something may have arrived between page load and socket open.
    if (connections > 0) router.refresh();
  }, [connections, router]);

  return null;
}
