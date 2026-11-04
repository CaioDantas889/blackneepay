import { and, eq, gt, lte } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";

const SESSION_COOKIE = "newpay_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
// Cloudflare Workers rejects PBKDF2 above 100,000 iterations. The count is stored
// in each hash, so it can be raised later without invalidating existing passwords.
const PBKDF2_ITERATIONS = 100_000;
const PASSWORD_HASH_SCHEME = "pbkdf2-sha256";

/** Verified when the e-mail is unknown, so response time does not reveal which e-mails exist. */
export const DUMMY_PASSWORD_HASH = `${PASSWORD_HASH_SCHEME}$${PBKDF2_ITERATIONS}$${"00".repeat(16)}$${"00".repeat(32)}`;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 256;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));

const randomHex = (byteLength: number) =>
  toHex(crypto.getRandomValues(new Uint8Array(byteLength)));

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

async function derivePasswordKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePasswordKey(password, salt, PBKDF2_ITERATIONS);
  return `${PASSWORD_HASH_SCHEME}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, expectedHex] = stored.split("$");
  if (scheme !== PASSWORD_HASH_SCHEME) return false;
  const actual = await derivePasswordKey(password, fromHex(salt), Number(iterations));
  const expected = fromHex(expectedHex);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function isSameOrigin(req: Request): boolean {
  return req.headers.get("origin") === new URL(req.url).origin;
}

/**
 * Call before any early response in a POST route. `wrangler dev`, which serves the
 * Docker container, intermittently replaces responses to requests whose body was
 * left unread with a plain-text 503.
 */
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = JSON.parse(await req.text());
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function sessionCookie(req: Request, value: string, maxAgeSeconds: number): string {
  // Local previews run over plain HTTP, where a Secure cookie would be discarded.
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

/** Stores only the token's hash, so reading the database does not yield usable sessions. */
export async function startSession(req: Request, userId: string): Promise<string> {
  const token = randomHex(32);
  const now = Date.now();
  const db = getDb();
  await db.delete(adminSessions).where(lte(adminSessions.expiresAt, now));
  await db.insert(adminSessions).values({
    tokenHash: await sha256Hex(token),
    userId,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  });
  return sessionCookie(req, token, SESSION_TTL_SECONDS);
}

export async function endSession(req: Request): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, await sha256Hex(token)));
  }
  return sessionCookie(req, "", 0);
}

/** Fails closed: any database error counts as signed out. */
export async function currentAdmin(): Promise<{ id: string; email: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [admin] = await getDb()
      .select({ id: adminUsers.id, email: adminUsers.email })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
      .where(and(eq(adminSessions.tokenHash, await sha256Hex(token)), gt(adminSessions.expiresAt, Date.now())))
      .limit(1);
    return admin ?? null;
  } catch {
    return null;
  }
}
