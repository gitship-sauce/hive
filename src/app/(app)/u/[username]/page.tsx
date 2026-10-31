import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostList } from "@/components/post-list";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/follows";
import { getPostsByAuthor } from "@/lib/posts";
import { usernameSchema } from "@/lib/validation";

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
        <ProfileView params={params} />
      </Suspense>
    </main>
  );
}

async function ProfileView({ params }: Pick<PageProps<"/u/[username]">, "params">) {
  const viewer = await requireUser();
  const parsed = usernameSchema.safeParse(decodeURIComponent((await params).username));
  if (!parsed.success) notFound();
  const profile = await getProfile(parsed.data, viewer.id);
  if (!profile) notFound();

  const posts = await getPostsByAuthor(profile.id);
  const isMe = profile.id === viewer.id;

  return (
    <>
      <section className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-bold">@{profile.username}</h1>
        <p className="mt-2 flex gap-4 text-sm text-neutral-500">
          <span>
            <strong data-testid="followers" className="text-neutral-900 dark:text-neutral-100">
              {profile.followers}
            </strong>{" "}
            {profile.followers === 1 ? "follower" : "followers"}
          </span>
          <span>
            <strong data-testid="following" className="text-neutral-900 dark:text-neutral-100">
              {profile.following}
            </strong>{" "}
            following
          </span>
        </p>
        {isMe && <p className="mt-3 text-sm text-neutral-500">This is you.</p>}
      </section>
      <PostList posts={posts} empty={isMe ? "You haven't posted yet." : `@${profile.username} hasn't posted yet.`} />
    </>
  );
}
