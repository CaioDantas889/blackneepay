import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const login=await fetch(base+'/signin-with-chatgpt?return_to=/admin',{redirect:'manual'});
const cookie=login.headers.get('set-cookie').split(';')[0];
const headers={origin:base,cookie,'content-type':'application/json'};
const id=crypto.randomUUID();
const sample={id,seller:'edioneide',quantity:40,date:'2026-11-04',note:'Registro descartável do teste local'};
const anonymous=await fetch(base+'/api/sales',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(sample)});
assert.equal(anonymous.status,401);
try {
 for(let i=0;i<2;i++)assert.equal((await fetch(base+'/api/sales',{method:'POST',headers,body:JSON.stringify(sample)})).status,200);
 const records=await (await fetch(base+'/api/sales')).json();
 assert.equal(records.filter(s=>s.id===id).length,1);
 assert.equal(records.find(s=>s.id===id).quantity,40);
 for(const quantity of [0,-1,1.5,1001])assert.equal((await fetch(base+'/api/sales',{method:'POST',headers,body:JSON.stringify({...sample,id:crypto.randomUUID(),quantity})})).status,400);
 const cross=await fetch(base+'/api/sales',{method:'POST',headers:{...headers,origin:'https://other.test'},body:JSON.stringify(sample)});
 assert.equal(cross.status,403);
} finally {
 const removed=await fetch(base+'/api/sales?id='+id,{method:'DELETE',headers});
 assert.equal(removed.status,200);
}
assert.ok(!(await (await fetch(base+'/api/sales')).json()).some(s=>s.id===id));
console.log('API local verificada: persistência, idempotência, validação, autenticação, origem e exclusão.');
