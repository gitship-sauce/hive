import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const user = await requireUser();
  return <h1 className="text-xl font-semibold">Hello, @{user.username}</h1>;
}
