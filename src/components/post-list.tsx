import Link from "next/link";
import type { PostView } from "@/lib/posts";
import { LocalTime } from "./local-time";

export function PostList({ posts, empty }: { posts: PostView[]; empty: string }) {
  if (posts.length === 0) return <p className="py-8 text-center text-neutral-500">{empty}</p>;

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {posts.map((post) => (
        <li key={post.id} data-testid="post" className="py-4">
          <div className="flex items-baseline gap-2 text-sm">
            <Link href={`/u/${post.author}`} className="font-semibold hover:underline">
              @{post.author}
            </Link>
            <span className="text-neutral-500">
              <LocalTime iso={post.createdAt.toISOString()} />
            </span>
          </div>
          {/* Plain text only: React escapes it, so a post can never become HTML or a script. */}
          <p className="mt-1 whitespace-pre-wrap break-words">{post.body}</p>
        </li>
      ))}
    </ul>
  );
}
