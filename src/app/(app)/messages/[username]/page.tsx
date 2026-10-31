import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatThread } from "@/components/chat-thread";
import { requireUser } from "@/lib/auth";
import { getUserIdByUsername } from "@/lib/follows";
import { getConversation } from "@/lib/messages";
import { usernameSchema } from "@/lib/validation";

export default function ChatPage({ params }: PageProps<"/messages/[username]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4">
      <Suspense fallback={<p className="py-6 text-neutral-500">Loading…</p>}>
        <Chat params={params} />
      </Suspense>
    </main>
  );
}

async function Chat({ params }: Pick<PageProps<"/messages/[username]">, "params">) {
  const me = await requireUser();
  const parsed = usernameSchema.safeParse(decodeURIComponent((await params).username));
  if (!parsed.success) notFound();
  const otherId = await getUserIdByUsername(parsed.data);
  if (otherId === null) notFound();
  if (otherId === me.id) redirect("/messages");

  const other = { id: otherId, username: parsed.data };
  const initial = await getConversation(me, other);

  return (
    <>
      <h1 className="border-b border-neutral-200 py-4 text-lg font-semibold dark:border-neutral-800">
        <Link href={`/u/${other.username}`} className="hover:underline">
          @{other.username}
        </Link>
      </h1>
      <ChatThread me={me.username} other={other.username} initial={initial} />
    </>
  );
}
