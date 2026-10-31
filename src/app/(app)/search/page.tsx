import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { searchUsers } from "@/lib/search";

export const metadata = { title: "Search · Hive" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold">Search people</h1>
      <Suspense fallback={<p className="mt-4 text-neutral-500">Loading…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  await requireUser();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").slice(0, 50);
  const results = await searchUsers(q);

  return (
    <>
      <form action="/search" className="mt-4">
        <label htmlFor="q" className="sr-only">
          Search by username
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by username"
          autoFocus
          className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </form>

      {q.trim() && results.length === 0 && (
        <p className="py-8 text-center text-neutral-500">Nobody found for “{q}”.</p>
      )}
      <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
        {results.map((u) => (
          <li key={u.username} data-testid="search-result">
            <Link href={`/u/${u.username}`} className="block py-3 font-medium hover:text-amber-600">
              @{u.username}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
