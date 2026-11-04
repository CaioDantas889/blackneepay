import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessions, adminSetupCodes, adminUsers } from "@/db/schema";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  isSameOrigin,
  normalizeEmail,
  readJsonObject,
  sha256Hex,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Creates an administrator, or replaces the password of an existing one, using a
 * single-use code from scripts/admin-setup-code.mjs. This keeps credentials out of
 * the repository: only the code's hash travels in a migration.
 */
export async function POST(req: Request) {
  const body = await readJsonObject(req);
  if (!isSameOrigin(req)) return json({ error: "Origem inválida." }, 403);

  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!code) return json({ error: "Preencha todos os campos." }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Informe um e-mail válido." }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return json({ error: `Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }, 400);
  }

  try {
    const db = getDb();
    const codeHash = await sha256Hex(code);
    const [valid] = await db
      .select()
      .from(adminSetupCodes)
      .where(eq(adminSetupCodes.codeHash, codeHash))
      .limit(1);
    if (!valid) return json({ error: "Código de configuração inválido ou já utilizado." }, 403);

    const passwordHash = await hashPassword(password);
    // Atomic: the code is only spent if the administrator is saved. Changing a
    // password also signs out every session of that administrator.
    await db.batch([
      db.delete(adminSetupCodes).where(eq(adminSetupCodes.codeHash, codeHash)),
      db
        .insert(adminUsers)
        .values({ id: crypto.randomUUID(), email, passwordHash, createdAt: new Date().toISOString() })
        .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash } }),
      db.delete(adminSessions).where(
        inArray(
          adminSessions.userId,
          db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)),
        ),
      ),
    ]);
    return json({ ok: true });
  } catch {
    return json({ error: "Não foi possível salvar o acesso. Tente novamente." }, 503);
  }
}
