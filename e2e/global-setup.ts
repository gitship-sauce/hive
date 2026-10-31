import { Pool } from "pg";
import { loadEnv } from "../scripts/env";
import { runMigrations } from "../scripts/migrate";

export default async function globalSetup() {
  loadEnv();
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set. Copy .env.example to .env.");
  await runMigrations(url);
  const pool = new Pool({ connectionString: url });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public'",
    );
    if (rows.length) {
      await pool.query(`truncate ${rows.map((r) => `"${r.tablename}"`).join(", ")} restart identity cascade`);
    }
  } finally {
    await pool.end();
  }
}
