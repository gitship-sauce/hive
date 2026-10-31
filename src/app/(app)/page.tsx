import { Suspense } from "react";
import { PostForm } from "@/components/post-form";
import { PostList } from "@/components/post-list";
import { requireUser } from "@/lib/auth";
import { getPostsByAuthor } from "@/lib/posts";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
        <Feed />
      </Suspense>
    </main>
  );
}

async function Feed() {
  const user = await requireUser();
  const posts = await getPostsByAuthor(user.id);
  return (
    <>
      <h1 className="sr-only">Hello, @{user.username}</h1>
      <PostForm />
      <PostList posts={posts} empty="No posts yet. Write the first one!" />
    </>
  );
}
