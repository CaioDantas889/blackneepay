export const sellers = [
 { id: 'edioneide', name: 'Edioneide', initials: 'ED', goal: 50, optional: false, tiers: [[32,0],[40,500],[45,600],[50,700]] },
 { id: 'netinho', name: 'Netinho', initials: 'NE', goal: 30, optional: false, tiers: [] },
 { id: 'daiara', name: 'Daiara', initials: 'DA', goal: 10, optional: true, tiers: [[5,200],[10,500]] },
 { id: 'sabrina', name: 'Sabrina', initials: 'SA', goal: 10, optional: true, tiers: [[5,200],[10,500]] },
 { id: 'larissa', name: 'Larissa', initials: 'LA', goal: 10, optional: true, tiers: [[5,200],[10,500]] },
];
export type Sale = { id: string; seller: string; quantity: number; date: string; note: string; createdAt: string };
export const money = (v: number) => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL',maximumFractionDigits:0});
export function bonus(id: string, count: number) { return sellers.find(s=>s.id===id)!.tiers.reduce((b,[n,v])=>count>=n?v:b,0); }
export function standings(sales: Sale[]) {
 const list = sellers.map(s=>({...s, count: sales.filter(x=>x.seller===s.id).reduce((n,x)=>n+x.quantity,0)})).sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name,'pt-BR'));
 return list.map(s=>({...s,rank: s.count === 0 ? null : 1 + list.filter(x=>x.count>s.count).length}));
}
