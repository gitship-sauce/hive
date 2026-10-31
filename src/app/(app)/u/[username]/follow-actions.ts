"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { follow, getUserIdByUsername, unfollow } from "@/lib/follows";
import { notify } from "@/lib/notify";
import { z } from "zod";
import { usernameSchema } from "@/lib/validation";

export type FollowState = { error?: string };

// Used with useActionState, which also passes the previous state and the form data; neither is needed here.
export async function setFollowing(username: string, shouldFollow: boolean): Promise<FollowState> {
  const viewer = await requireUser();
  // Server action arguments come from the browser, so check them like any other input.
  const wanted = z.boolean().safeParse(shouldFollow);
  if (!wanted.success) return { error: "Invalid request." };
  const parsed = usernameSchema.safeParse(username);
  const targetId = parsed.success ? await getUserIdByUsername(parsed.data) : null;
  if (targetId === null) return { error: "That user doesn't exist." };

  if (wanted.data) {
    const result = await follow(viewer.id, targetId);
    if (!result.ok) return { error: result.error };
    if (result.created) {
      await notify(
        { userId: targetId, type: "follow", actorId: viewer.id },
        { title: "New follower", body: `@${viewer.username} followed you`, url: `/u/${viewer.username}` },
      );
    }
  } else {
    await unfollow(viewer.id, targetId);
  }
  refresh();
  return {};
}
