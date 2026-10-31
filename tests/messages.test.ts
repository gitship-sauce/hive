import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getConversation, saveMessage } from "@/lib/messages";
import { firstError, messageBodySchema } from "@/lib/validation";
import { makeUser } from "./helpers";

async function person(username: string) {
  return { id: await makeUser(username), username };
}

describe("send and read messages (T5.2)", () => {
  it("shows the conversation oldest first, from both sides", async () => {
    const a = await person("alice");
    const b = await person("bob");
    await saveMessage(a, b, "hi bob");
    await saveMessage(b, a, "hi alice");
    await saveMessage(a, b, "how are you?");

    const fromA = await getConversation(a, b);
    expect(fromA.map((m) => [m.from, m.body])).toEqual([
      ["alice", "hi bob"],
      ["bob", "hi alice"],
      ["alice", "how are you?"],
    ]);
    expect((await getConversation(b, a)).map((m) => m.id)).toEqual(fromA.map((m) => m.id));
  });

  it("nobody can read a conversation they are not in", async () => {
    const a = await person("alice");
    const b = await person("bob");
    const c = await person("carol");
    await saveMessage(a, b, "secret for bob");
    expect(await getConversation(c, a)).toEqual([]);
    expect(await getConversation(c, b)).toEqual([]);
  });

  it("keeps the newest messages when there are more than the limit, still oldest first", async () => {
    const a = await person("alice");
    const b = await person("bob");
    for (let i = 1; i <= 5; i++) await saveMessage(a, b, `m${i}`);
    expect((await getConversation(a, b, 3)).map((m) => m.body)).toEqual(["m3", "m4", "m5"]);
  });

  it("checks the message text", () => {
    expect(firstError(messageBodySchema.safeParse("  ").error!)).toBe("Write a message first.");
    expect(firstError(messageBodySchema.safeParse("a".repeat(1001)).error!)).toBe(
      "Messages can be up to 1000 characters.",
    );
    expect(messageBodySchema.safeParse("a".repeat(1000)).success).toBe(true);
  });

  it("the database refuses messages to yourself and too-long ones", async () => {
    const a = await person("alice");
    const b = await person("bob");
    await expect(saveMessage(a, a, "me")).rejects.toThrow();
    await expect(db.insert(messages).values({ senderId: a.id, recipientId: a.id, body: "x" })).rejects.toThrow();
    await expect(db.insert(messages).values({ senderId: a.id, recipientId: b.id, body: "a".repeat(1001) })).rejects.toThrow();
  });
});
