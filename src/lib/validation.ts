import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "Username must be 3–20 letters, numbers or _.");

// bcrypt only reads the first 72 bytes, so a longer password would be cut without telling the user.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((p) => Buffer.byteLength(p, "utf8") <= 72, "Password must be at most 72 bytes.");

export const credentialsSchema = z.object({ username: usernameSchema, password: passwordSchema });

/** First error message from a failed zod parse, for showing to the user. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
