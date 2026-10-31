import { createUser } from "@/lib/users";

export async function makeUser(username: string, password = "password123") {
  const created = await createUser(username, password);
  if (!created.ok) throw new Error(created.error);
  return created.value.id;
}
