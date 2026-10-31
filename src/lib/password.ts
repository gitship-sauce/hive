import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Compared against when the username doesn't exist, so a wrong username takes as long as a wrong password.
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", ROUNDS);
