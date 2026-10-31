"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/app/(app)/notifications/actions";

/** Marks notifications read once the page is really on screen. */
export function MarkRead() {
  useEffect(() => {
    markNotificationsRead().catch((err) => console.error("Couldn't mark notifications read", err));
  }, []);
  return null;
}
