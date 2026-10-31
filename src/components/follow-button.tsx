"use client";

import { useActionState } from "react";
import { setFollowing } from "@/app/(app)/u/[username]/follow-actions";

export function FollowButton({ username, following }: { username: string; following: boolean }) {
  const [state, formAction, pending] = useActionState(setFollowing.bind(null, username, !following), {});

  return (
    <form action={formAction} className="mt-4 flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className={
          following
            ? "rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold hover:border-red-400 hover:text-red-600 disabled:opacity-60 dark:border-neutral-700"
            : "rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
        }
      >
        {following ? "Unfollow" : "Follow"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
