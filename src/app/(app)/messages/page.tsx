import Link from "next/link";
import { Suspense } from "react";
import { LocalTime } from "@/components/local-time";
import { RefreshOnMessage } from "@/components/refresh-on-message";
import { requireUser } from "@/lib/auth";
import { getConversations } from "@/lib/messages";

export const metadata = { title: "Messages · Hive" };

export default function MessagesPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold">Messages</h1>
      <Suspense fallback={<p className="mt-4 text-neutral-500">Loading…</p>}>
        <Conversations />
      </Suspense>
    </main>
  );
}

async function Conversations() {
  const me = await requireUser();
  const list = await getConversations(me.id);

  return (
    <>
      <RefreshOnMessage />
      {list.length === 0 ? (
        <p className="py-8 text-center text-neutral-500">
          No conversations yet. Open someone&apos;s profile and press Message.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
          {list.map((c) => (
            <li key={c.with} data-testid="conversation">
              <Link href={`/messages/${c.with}`} className="block py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">@{c.with}</span>
                  <span className="text-xs text-neutral-500">
                    <LocalTime iso={c.lastAt} />
                  </span>
                </div>
                <p className="truncate text-sm text-neutral-500">
                  {c.lastFromMe ? "You: " : ""}
                  {c.lastBody}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
