import { describe, expect, it, vi } from "vitest";
import type { Message } from "firebase-admin/messaging";
import { getPushFids, savePushRegistration } from "@/lib/push-registrations";
import { queuePush, sendPushWith, type PushSender } from "@/lib/push";
import { createSession, hashToken } from "@/lib/sessions";
import { makeUser } from "./helpers";

async function userWithBrowsers(username: string, fids: string[]) {
  const id = await makeUser(username);
  const { token } = await createSession(id);
  for (const fid of fids) await savePushRegistration(fid, id, hashToken(token));
  return id;
}

const CONTENT = { title: "New follower", body: "@sammy followed you", url: "/u/sammy" };

describe("send push from the server (T6.5)", () => {
  it("sends one push to every browser where the user turned push on, and nobody else", async () => {
    const gitsy = await userWithBrowsers("gitsy", ["fid_laptop_aaaa", "fid_phone_bbbbb"]);
    await userWithBrowsers("sammy", ["fid_sammy_ccccc"]);
    const sent: Message[] = [];
    const sender: PushSender = { send: async (m) => (sent.push(m), "msg-id") };

    expect(await sendPushWith(sender, gitsy, CONTENT)).toEqual({ sent: 2, removed: 0 });
    expect(sent.map((m) => ("fid" in m ? m.fid : null)).sort()).toEqual(["fid_laptop_aaaa", "fid_phone_bbbbb"]);
    expect(sent[0]).toMatchObject({
      notification: { title: "New follower", body: "@sammy followed you" },
      data: { url: "/u/sammy" },
    });
  });

  it("deletes a browser Firebase says is gone, and keeps the others", async () => {
    const gitsy = await userWithBrowsers("gitsy", ["fid_dead_aaaaaa", "fid_alive_bbbbb"]);
    const sender: PushSender = {
      send: async (m) => {
        if ("fid" in m && m.fid === "fid_dead_aaaaaa") {
          throw Object.assign(new Error("not registered"), { code: "messaging/installation-id-not-registered" });
        }
        return "msg-id";
      },
    };
    expect(await sendPushWith(sender, gitsy, CONTENT)).toEqual({ sent: 1, removed: 1 });
    expect(await getPushFids(gitsy)).toEqual(["fid_alive_bbbbb"]);
  });

  it("logs other Firebase errors and keeps the browser", async () => {
    const gitsy = await userWithBrowsers("gitsy", ["fid_flaky_aaaaa"]);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sender: PushSender = { send: async () => Promise.reject(Object.assign(new Error("quota"), { code: "messaging/quota-exceeded" })) };
    expect(await sendPushWith(sender, gitsy, CONTENT)).toEqual({ sent: 0, removed: 0 });
    expect(error).toHaveBeenCalled();
    expect(await getPushFids(gitsy)).toEqual(["fid_flaky_aaaaa"]);
    error.mockRestore();
  });

  it("without Firebase keys nothing is sent and the server says push is off", async () => {
    const saved = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const gitsy = await userWithBrowsers("gitsy", ["fid_laptop_aaaa"]);
    expect(await queuePush(gitsy, CONTENT)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Push notifications are off"));
    warn.mockRestore();
    if (saved !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT_FILE = saved;
  });
});
