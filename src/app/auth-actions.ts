"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { checkLogin, createUser } from "@/lib/users";
import { credentialsSchema, firstError } from "@/lib/validation";

export type FormState = { error?: string; username?: string };

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = readCredentials(formData);
  const username = String(formData.get("username") ?? "");
  if (!parsed.success) return { error: firstError(parsed.error), username };

  const created = await createUser(parsed.data.username, parsed.data.password);
  if (!created.ok) return { error: created.error, username };

  await startSession(created.value.id);
  redirect("/");
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "");
  const parsed = readCredentials(formData);
  const user = parsed.success ? await checkLogin(parsed.data.username, parsed.data.password) : null;
  // Same message for every failure, so the form doesn't reveal which usernames exist.
  if (!user) return { error: "Wrong username or password.", username };

  await startSession(user.id);
  redirect("/");
}

export async function logOut() {
  await endSession();
  redirect("/login");
}
