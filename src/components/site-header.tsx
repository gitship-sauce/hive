import Link from "next/link";
import { logOut } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav className="mx-auto flex h-14 w-full max-w-xl items-center gap-4 px-4 text-sm">
        <Link href="/" className="text-lg font-bold tracking-tight text-amber-500">
          Hive
        </Link>
        <Link href="/" className="hover:underline">
          Feed
        </Link>
        <Link href="/search" className="hover:underline">
          Search
        </Link>
        <Link href="/messages" className="hover:underline">
          Messages
        </Link>
        <Link href={`/u/${user.username}`} className="ml-auto font-medium hover:underline">
          @{user.username}
        </Link>
        <form action={logOut}>
          <button type="submit" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
