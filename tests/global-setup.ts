import { loadEnv } from "../scripts/env";
import { runMigrations } from "../scripts/migrate";

export default async function globalSetup() {
  loadEnv();
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set. Copy .env.example to .env.");
  await runMigrations(url);
}
