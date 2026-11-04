import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  DUMMY_PASSWORD_HASH,
  MAX_PASSWORD_LENGTH,
  TOO_MANY_ATTEMPTS,
  clearPasswordAttempts,
  isSameOrigin,
  normalizeEmail,
  readJsonObject,
  registerPasswordAttempt,
  startSession,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
    const attempt = await registerPasswordAttempt(req, email);
    if (attempt.retryAfterSeconds > 0) {
      return json({ error: TOO_MANY_ATTEMPTS }, 429, { "Retry-After": String(attempt.retryAfterSeconds) });
    }

    const [user] = await getDb().select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid) return json({ error: INVALID_CREDENTIALS }, 401);

    await clearPasswordAttempts(attempt.key);
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(req, user.id) });
  } catch {
    return json({ error: "Não foi possível verificar as credenciais. Tente novamente." }, 503);
  }
}
