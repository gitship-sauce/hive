import { existsSync } from "node:fs";

// Local runs read .env; CI and Docker pass real environment variables instead.
export function loadEnv() {
  if (existsSync(".env")) process.loadEnvFile(".env");
}
