import { endSession, isSameOrigin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Origem inválida." }, 403);
  try {
    return json({ ok: true }, 200, { "Set-Cookie": await endSession(req) });
  } catch {
    return json({ error: "Não foi possível sair. Tente novamente." }, 503);
  }
}
