import { eq, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminLoginAttempts, adminUsers } from "@/db/schema";
import {
  DUMMY_PASSWORD_HASH,
  MAX_PASSWORD_LENGTH,
  isSameOrigin,
  normalizeEmail,
  readJsonObject,
  sha256Hex,
  startSession,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = "E-mail ou senha incorretos.";

const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  const body = await readJsonObject(req);
  if (!isSameOrigin(req)) return json({ error: "Origem inválida." }, 403);

  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return json({ error: "Informe e-mail e senha." }, 400);
  if (password.length > MAX_PASSWORD_LENGTH) return json({ error: INVALID_CREDENTIALS }, 401);

  try {
    const db = getDb();
    const now = Date.now();
    await db.delete(adminLoginAttempts).where(lte(adminLoginAttempts.resetAt, now));

    // The attempt is counted before verifying, so parallel requests cannot slip past the limit.
    const key = await sha256Hex(`${email}|${req.headers.get("cf-connecting-ip") ?? "local"}`);
    const [attempt] = await db
      .insert(adminLoginAttempts)
      .values({ key, failures: 1, resetAt: now + ATTEMPT_WINDOW_MS })
      .onConflictDoUpdate({
        target: adminLoginAttempts.key,
        set: { failures: sql`${adminLoginAttempts.failures} + 1` },
      })
      .returning({ failures: adminLoginAttempts.failures, resetAt: adminLoginAttempts.resetAt });
    if (attempt.failures > MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((attempt.resetAt - now) / 1000);
      return json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid) return json({ error: INVALID_CREDENTIALS }, 401);

    await db.delete(adminLoginAttempts).where(eq(adminLoginAttempts.key, key));
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(req, user.id) });
  } catch {
    return json({ error: "Não foi possível verificar as credenciais. Tente novamente." }, 503);
  }
}
