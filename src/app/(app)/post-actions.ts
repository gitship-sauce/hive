"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import { firstError, postBodySchema } from "@/lib/validation";

export type PostFormState = { error?: string; body?: string };

export async function createPostAction(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireUser();
  const raw = String(formData.get("body") ?? "");
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) return { error: firstError(parsed.error), body: raw };

  await createPost(user.id, parsed.data);
  refresh();
  return {};
}
