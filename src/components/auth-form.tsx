"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/auth-actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  title: string;
  submitLabel: string;
  passwordAutoComplete: "new-password" | "current-password";
  switchText: string;
  switchHref: string;
  switchLabel: string;
};

export function AuthForm(props: Props) {
  const [state, formAction, pending] = useActionState(props.action, {});

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <p className="text-3xl font-bold tracking-tight text-amber-500">Hive</p>
      <h1 className="mt-2 text-xl font-semibold">{props.title}</h1>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Username
          <input
            name="username"
            defaultValue={state.username}
            autoComplete="username"
            required
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base font-normal text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            autoComplete={props.passwordAutoComplete}
            required
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base font-normal text-neutral-900 outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {pending ? "Please wait…" : props.submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        {props.switchText}{" "}
        <Link href={props.switchHref} className="font-medium text-amber-600 hover:underline">
          {props.switchLabel}
        </Link>
      </p>
    </main>
  );
}
