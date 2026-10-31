import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

describe("database", () => {
  it("inserts a user and reads it back", async () => {
    await db.insert(users).values({ username: "gitsy", passwordHash: "x" });
    const [row] = await db.select().from(users).where(eq(users.username, "gitsy"));
    expect(row.username).toBe("gitsy");
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("refuses a second user with the same username", async () => {
    await db.insert(users).values({ username: "gitsy", passwordHash: "x" });
    await expect(db.insert(users).values({ username: "gitsy", passwordHash: "y" })).rejects.toThrow();
  });
});
