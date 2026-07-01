import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  accent: string;
};

type StoredUser = PublicUser & {
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

type UserDatabase = {
  users: StoredUser[];
};

const USERS_FILE = resolve(process.env.AUTH_USERS_FILE ?? "storage/users.json");
const sessions = new Map<string, string>();

function loadDatabase(): UserDatabase {
  if (!existsSync(USERS_FILE)) {
    return { users: [] };
  }

  return JSON.parse(readFileSync(USERS_FILE, "utf8")) as UserDatabase;
}

function saveDatabase(database: UserDatabase) {
  mkdirSync(dirname(USERS_FILE), { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(database, null, 2));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
  return { hash, salt };
}

function verifyPassword(password: string, user: StoredUser) {
  const { hash } = hashPassword(password, user.passwordSalt);
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    role: user.role,
    accent: user.accent
  };
}

function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, userId);
  return token;
}

export function registerUser(input: { firstName: string; lastName: string; email: string; password: string }) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = normalizeEmail(input.email);

  if (!firstName || !lastName || !email || input.password.length < 4) {
    throw new Error("invalid_registration_payload");
  }

  const database = loadDatabase();
  if (database.users.some((user) => user.email === email)) {
    throw new Error("email_already_registered");
  }

  const { hash, salt } = hashPassword(input.password);
  const user: StoredUser = {
    id: randomUUID(),
    email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    role: "Secure Reviewer",
    accent: "#22d3ee",
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString()
  };

  database.users.push(user);
  saveDatabase(database);

  return {
    token: createSession(user.id),
    user: toPublicUser(user)
  };
}

export function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const database = loadDatabase();
  const user = database.users.find((candidate) => candidate.email === email);

  if (!user || !verifyPassword(input.password, user)) {
    throw new Error("invalid_credentials");
  }

  return {
    token: createSession(user.id),
    user: toPublicUser(user)
  };
}

export function getUserFromToken(token: string | null) {
  if (!token) {
    return null;
  }

  const userId = sessions.get(token);
  if (!userId) {
    return null;
  }

  const database = loadDatabase();
  const user = database.users.find((candidate) => candidate.id === userId);
  return user ? toPublicUser(user) : null;
}

export function logout(token: string | null) {
  if (token) {
    sessions.delete(token);
  }
}
