import Link from "next/link";
import { logOut } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { NotificationBell } from "./notification-bell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  if (!user) return null;
  const unread = await getUnreadCount(user.id);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      {/* Phones (360 px and up) get a shorter header: the logo already goes to the feed, and "Me" replaces the username. */}
      <nav className="mx-auto flex h-14 w-full max-w-xl items-center gap-3 px-3 text-sm sm:gap-4 sm:px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-amber-500">
          Hive
        </Link>
        <Link href="/" className="hidden hover:underline sm:inline">
          Feed
        </Link>
        <Link href="/search" className="hover:underline">
          Search
        </Link>
        <Link href="/messages" className="hover:underline">
          Messages
        </Link>
        <span className="ml-auto" />
        <NotificationBell initial={unread} />
        <Link href={`/u/${user.username}`} className="font-medium hover:underline">
          <span className="sm:hidden">Me</span>
          <span className="hidden sm:inline">@{user.username}</span>
        </Link>
        <form action={logOut}>
          <button type="submit" className="whitespace-nowrap text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
