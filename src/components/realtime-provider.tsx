"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { RealtimeEvent } from "@/lib/realtime";

type Listener = (event: RealtimeEvent) => void;
type Realtime = {
  subscribe: (listener: Listener) => () => void;
  connected: boolean;
  /** Goes up by one on every (re)connect, so pages can re-load what they missed while offline. */
  connections: number;
};

const RealtimeContext = createContext<Realtime | null>(null);

/** Keeps one WebSocket open to /ws while you are logged in, and reconnects if it drops. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function connect() {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${location.host}/ws`);
      ws.onopen = () => {
        retry = 0;
        setConnected(true);
        setConnections((n) => n + 1);
      };
      ws.onmessage = (e) => {
        let event: RealtimeEvent;
        try {
          event = JSON.parse(e.data);
        } catch {
          console.error("Bad message from /ws", e.data);
          return;
        }
        for (const listener of listeners.current) listener(event);
      };
      ws.onclose = (e) => {
        setConnected(false);
        // 4001 = logged out: don't knock on the door again.
        if (stopped || e.code === 4001) return;
        // Wait 1 s, 2 s, 4 s… up to 30 s, so a restarting server isn't flooded.
        timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    // Lets you (and the browser tests) see the connection state in DevTools.
    document.documentElement.dataset.realtime = connected ? "connected" : "disconnected";
  }, [connected]);

  const [value] = useState<Pick<Realtime, "subscribe">>(() => ({
    subscribe(listener: Listener) {
      listeners.current.add(listener);
      return () => listeners.current.delete(listener);
    },
  }));

  return <RealtimeContext value={{ ...value, connected, connections }}>{children}</RealtimeContext>;
}

export function useRealtime() {
  const realtime = useContext(RealtimeContext);
  if (!realtime) throw new Error("useRealtime must be used inside RealtimeProvider");
  return realtime;
}
