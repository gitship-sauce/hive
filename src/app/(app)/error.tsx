"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-neutral-500">That didn&apos;t work. Your data is safe. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-amber-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-400"
      >
        Try again
      </button>
    </main>
  );
}
