import { Suspense } from "react";
import { PostForm } from "@/components/post-form";
import { PostList } from "@/components/post-list";
import { requireUser } from "@/lib/auth";
import { getFeed } from "@/lib/posts";

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
  const posts = await getFeed(user.id);
  return (
    <>
      <h1 className="sr-only">Hello, @{user.username}</h1>
      <PostForm />
      <PostList posts={posts} empty="Your feed is empty. Write a post, or search for people to follow." />
    </>
  );
}
