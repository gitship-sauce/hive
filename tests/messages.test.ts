import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getConversation, getConversations, saveMessage } from "@/lib/messages";
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

describe("conversation list (T5.4)", () => {
  it("lists everyone I talked with, newest conversation first, with the last message", async () => {
    const me = await person("gitsy");
    const sammy = await person("sammy");
    const milo = await person("milo");
    const stranger = await person("stranger");

    await saveMessage(me, sammy, "hi sammy");
    await saveMessage(milo, me, "hi gitsy, it's milo");
    await saveMessage(sammy, me, "hey!");
    await saveMessage(stranger, sammy, "not for gitsy");

    const list = await getConversations(me.id);
    expect(list.map((c) => [c.with, c.lastBody, c.lastFromMe])).toEqual([
      ["sammy", "hey!", false],
      ["milo", "hi gitsy, it's milo", false],
    ]);
  });

  it("marks the last message as mine when I sent it", async () => {
    const me = await person("gitsy");
    const sammy = await person("sammy");
    await saveMessage(sammy, me, "question?");
    await saveMessage(me, sammy, "answer.");
    expect(await getConversations(me.id)).toMatchObject([{ with: "sammy", lastBody: "answer.", lastFromMe: true }]);
  });

  it("is empty when I have no messages", async () => {
    const me = await person("gitsy");
    expect(await getConversations(me.id)).toEqual([]);
  });
});
