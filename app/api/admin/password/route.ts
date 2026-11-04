import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  TOO_MANY_ATTEMPTS,
  clearPasswordAttempts,
  currentAdmin,
  hashPassword,
  isSameOrigin,
  readJsonObject,
  registerPasswordAttempt,
  startSession,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  const body = await readJsonObject(req);
  const admin = await currentAdmin();
  if (!admin) return json({ error: "Entre na sua conta para trocar a senha." }, 401);
  if (!isSameOrigin(req)) return json({ error: "Origem inválida." }, 403);

  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || !newPassword) return json({ error: "Preencha todos os campos." }, 400);
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return json({ error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }, 400);
  }
  if (newPassword === currentPassword) {
    return json({ error: "A nova senha deve ser diferente da atual." }, 400);
  }

  try {
    const attempt = await registerPasswordAttempt(req, admin.email);
    if (attempt.retryAfterSeconds > 0) {
      return json({ error: TOO_MANY_ATTEMPTS }, 429, { "Retry-After": String(attempt.retryAfterSeconds) });
    }

    const db = getDb();
    const [user] = await db
      .select({ passwordHash: adminUsers.passwordHash })
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.id))
      .limit(1);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return json({ error: "Senha atual incorreta." }, 403);
    }

    // Signs out every other device; this one continues with a new session.
    const passwordHash = await hashPassword(newPassword);
    await db.batch([
      db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, admin.id)),
      db.delete(adminSessions).where(eq(adminSessions.userId, admin.id)),
    ]);
    await clearPasswordAttempts(attempt.key);
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(req, admin.id) });
  } catch {
    return json({ error: "Não foi possível trocar a senha. Tente novamente." }, 503);
  }
}
