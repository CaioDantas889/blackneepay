import { getDb } from '@/db';
import { sales } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { sellers } from '../../rules';
export const dynamic = 'force-dynamic';
const json = (v: unknown, status=200) => Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
function authorize(req: Request) {
 if (!req.headers.get('oai-authenticated-user-id')) return json({error:'Entre na sua conta para administrar.'},401);
 const origin=req.headers.get('origin');
 if (!origin || origin!==new URL(req.url).origin) return json({error:'Origem inválida.'},403);
 return null;
}
export async function GET() {
 try { return json(await getDb().select({id:sales.id,seller:sales.seller,quantity:sales.quantity,date:sales.date,note:sales.note,createdAt:sales.createdAt}).from(sales).orderBy(desc(sales.createdAt))); }
 catch { return json({error:'Não foi possível carregar as vendas. Tente novamente.'},503); }
}
export async function POST(req: Request) {
 const denied=authorize(req); if(denied) return denied;
 let b: Record<string, unknown>; try { const raw=await req.json(); if(!raw || typeof raw!=="object" || Array.isArray(raw)) return json({error:"Registro inválido."},400); b=raw as Record<string, unknown>; } catch { return json({error:'Registro inválido.'},400); }
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if (!b || typeof b.seller!=="string" || !sellers.some(s=>s.id===b.seller) || typeof b.quantity!=="number" || !Number.isInteger(b.quantity) || b.quantity<1 || b.quantity>1000 || typeof b.date!=='string' || !/^2026-11-(0[1-9]|[12]\d|30)$/.test(b.date) || b.date>today || typeof b.note!=='string' || b.note.length>200 || typeof b.id!=='string' || !/^[a-f0-9-]{36}$/.test(b.id)) return json({error:'Confira vendedor, quantidade e data. Use uma data de novembro/2026 que não seja futura.'},400);
 try { await getDb().insert(sales).values({id:b.id,seller:b.seller,quantity:b.quantity,date:b.date,note:b.note.trim(),createdAt:new Date().toISOString(),createdBy:req.headers.get('oai-authenticated-user-id')!}).onConflictDoNothing(); return json({ok:true}); }
 catch { return json({error:'Não foi possível salvar. Tente novamente.'},503); }
}
export async function DELETE(req: Request) {
 const denied=authorize(req); if(denied) return denied;
 const id=new URL(req.url).searchParams.get('id'); if(!id) return json({error:'Registro inválido.'},400);
 try { await getDb().delete(sales).where(eq(sales.id,id)); return json({ok:true}); }
 catch { return json({error:'Não foi possível excluir. Tente novamente.'},503); }
}
