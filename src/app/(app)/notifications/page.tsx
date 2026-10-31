import Link from "next/link";
import { Suspense } from "react";
import { LocalTime } from "@/components/local-time";
import { MarkRead } from "@/components/mark-read";
import { PushToggle } from "@/components/push-toggle";
import { requireUser } from "@/lib/auth";
import { getFirebaseWebConfig } from "@/lib/firebase-config";
import { getNotifications, type NotificationView } from "@/lib/notifications";

export const metadata = { title: "Notifications · Hive" };

export default function NotificationsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <Suspense fallback={<p className="mt-4 text-neutral-500">Loading…</p>}>
        <List />
      </Suspense>
    </main>
  );
}

function describe(n: NotificationView) {
  return n.type === "follow"
    ? { text: `@${n.actor} followed you`, href: `/u/${n.actor}` }
    : { text: `@${n.actor} sent you a message`, href: `/messages/${n.actor}` };
}

async function List() {
  const me = await requireUser();
  const list = await getNotifications(me.id);
  const firebase = getFirebaseWebConfig();

  return (
    <>
      <MarkRead />
      {firebase && <PushToggle config={firebase} />}
      {list.length === 0 ? (
        <p className="py-8 text-center text-neutral-500">Nothing yet. Follows and messages show up here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
          {list.map((n) => {
            const { text, href } = describe(n);
            return (
              <li key={n.id} data-testid="notification" data-unread={!n.read || undefined}>
                <Link
                  href={href}
                  className={`flex items-baseline justify-between gap-2 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${n.read ? "" : "font-semibold"}`}
                >
                  <span>
                    {!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" aria-label="New" />}
                    {text}
                  </span>
                  <span className="shrink-0 text-xs font-normal text-neutral-500">
                    <LocalTime iso={n.createdAt} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
