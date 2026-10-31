import { afterAll, beforeEach } from "vitest";
import { loadEnv } from "../scripts/env";

loadEnv();
// Tests must never touch the real database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const { pool } = await import("@/db");

beforeEach(async () => {
  const { rows } = await pool.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public'",
  );
  if (rows.length) {
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await pool.query(`truncate ${tables} restart identity cascade`);
  }
});

afterAll(async () => {
  await pool.end();
  delete (globalThis as { pool?: unknown }).pool;
});
