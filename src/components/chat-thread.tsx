"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/app/(app)/messages/actions";
import type { MessageView } from "@/lib/messages";
import { LocalTime } from "./local-time";

type Props = { me: string; other: string; initial: MessageView[] };

/** Adds messages by id, so a message that arrives twice (reply + live push) shows once. */
function merge(list: MessageView[], incoming: MessageView) {
  return list.some((m) => m.id === incoming.id) ? list : [...list, incoming];
}

export function ChatThread({ me, other, initial }: Props) {
  const [list, setList] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [list.length]);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await sendMessage(other, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setList((l) => merge(l, result.message));
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <ol aria-label={`Messages with @${other}`} className="flex flex-1 flex-col gap-2 py-4">
        {list.length === 0 && (
          <li className="py-8 text-center text-neutral-500">No messages yet. Say hello to @{other}!</li>
        )}
        {list.map((m) => {
          const mine = m.from === me;
          return (
            <li key={m.id} data-testid="message" className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {/* Plain text only: React escapes it, so a message can never run as HTML. */}
              <p
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 ${
                  mine ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {m.body}
              </p>
              <span className="mt-0.5 text-xs text-neutral-500">
                <LocalTime iso={m.createdAt} />
              </span>
            </li>
          );
        })}
      </ol>
      <div ref={bottomRef} />

      <form ref={formRef} action={submit} className="sticky bottom-0 flex gap-2 border-t border-neutral-200 bg-[var(--background)] py-3 dark:border-neutral-800">
        <label htmlFor="message-body" className="sr-only">
          Message
        </label>
        <input
          id="message-body"
          name="body"
          autoComplete="off"
          placeholder={`Message @${other}`}
          className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
        >
          Send
        </button>
      </form>
      {error && (
        <p role="alert" className="pb-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
