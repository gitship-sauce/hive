"use client";

import { useActionState, useState } from "react";
import { createPostAction } from "@/app/(app)/post-actions";
import { charCount, POST_MAX } from "@/lib/validation";

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPostAction, {});
  const [length, setLength] = useState(0);

  // After a failed post the text comes back from the server; count it again.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setLength(charCount(state.body ?? ""));
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <label htmlFor="post-body" className="sr-only">
        What&apos;s happening?
      </label>
      <textarea
        id="post-body"
        name="body"
        rows={3}
        defaultValue={state.body}
        placeholder="What's happening?"
        onChange={(e) => setLength(charCount(e.target.value))}
        className="w-full resize-none bg-transparent text-base outline-none placeholder:text-neutral-400"
      />
      {state.error && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        <span className={`text-xs ${length > POST_MAX ? "text-red-600" : "text-neutral-400"}`}>
          {length}/{POST_MAX}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
