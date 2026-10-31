import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUser } from "@/lib/users";
import { credentialsSchema, firstError } from "@/lib/validation";

function parse(username: string, password: string) {
  return credentialsSchema.safeParse({ username, password });
}

describe("sign up (T1.1)", () => {
  it("stores only a bcrypt hash of the password", async () => {
    const created = await createUser("gitsy", "correct horse");
    expect(created.ok).toBe(true);
    const [row] = await db.select().from(users).where(eq(users.username, "gitsy"));
    expect(row.passwordHash).not.toContain("correct horse");
    expect(row.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("refuses a taken username, whatever its letter case", async () => {
    await createUser("gitsy", "password1");
    const again = parse("GITSY", "password2");
    expect(again.success).toBe(true);
    const result = await createUser(again.data!.username, again.data!.password);
    expect(result).toEqual({ ok: false, error: "That username is taken." });
  });

  it.each([
    ["ab", "Username must be 3–20 letters, numbers or _."],
    ["has space", "Username must be 3–20 letters, numbers or _."],
    ["<script>", "Username must be 3–20 letters, numbers or _."],
    ["a".repeat(21), "Username must be 3–20 letters, numbers or _."],
  ])("rejects the username %j", (username, message) => {
    const parsed = parse(username, "password1");
    expect(parsed.success).toBe(false);
    expect(firstError(parsed.error!)).toBe(message);
  });

  it("rejects a password under 8 characters", () => {
    const parsed = parse("gitsy", "short");
    expect(firstError(parsed.error!)).toBe("Password must be at least 8 characters.");
  });

  it("rejects a password longer than bcrypt can read", () => {
    const parsed = parse("gitsy", "x".repeat(73));
    expect(firstError(parsed.error!)).toBe("Password must be at most 72 bytes.");
  });
});
