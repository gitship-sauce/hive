import { describe, expect, it } from "vitest";
import { escapeLike, searchUsers } from "@/lib/search";
import { makeUser } from "./helpers";

const names = (rows: { username: string }[]) => rows.map((r) => r.username);

describe("search users (T4.1)", () => {
  it("finds users by part of the name, whatever the letter case", async () => {
    await makeUser("gitsy");
    await makeUser("sammy");
    await makeUser("big_git");
    expect(names(await searchUsers("GIT"))).toEqual(["gitsy", "big_git"]);
  });

  it("puts an exact match first, then names that start with the text", async () => {
    await makeUser("sam");
    await makeUser("sammy");
    await makeUser("busam");
    expect(names(await searchUsers("sam"))).toEqual(["sam", "sammy", "busam"]);
  });

  it("searches % and _ as plain text", async () => {
    await makeUser("a_b");
    await makeUser("axb");
    expect(names(await searchUsers("a_b"))).toEqual(["a_b"]);
    expect(await searchUsers("%")).toEqual([]);
    expect(escapeLike("50%_\\")).toBe("50\\%\\_\\\\");
  });

  it("returns at most 20 users", async () => {
    for (let i = 0; i < 25; i++) await makeUser(`user${String(i).padStart(2, "0")}`);
    expect(await searchUsers("user")).toHaveLength(20);
  });

  it("returns nothing for empty text", async () => {
    await makeUser("gitsy");
    expect(await searchUsers("   ")).toEqual([]);
  });
});
