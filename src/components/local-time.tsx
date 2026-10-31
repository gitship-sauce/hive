"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Shows a time in the viewer's own time zone. The server doesn't know it, so it sends UTC first. */
export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    () => `${iso.slice(0, 16).replace("T", " ")} UTC`,
  );
  return <time dateTime={iso}>{text}</time>;
}
