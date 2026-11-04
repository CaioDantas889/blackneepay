import assert from 'node:assert/strict';
const base=process.env.BASE_URL??'http://127.0.0.1:5173';
const {ADMIN_EMAIL:email,ADMIN_PASSWORD:password}=process.env;
assert.ok(email&&password,'Defina ADMIN_EMAIL e ADMIN_PASSWORD com um administrador local criado em /admin/setup.');
const post=(path,body,headers={})=>fetch(base+path,{method:'POST',redirect:'manual',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const adminPage=(cookie='')=>fetch(base+'/admin',{redirect:'manual',headers:{cookie}});
const assertRedirectsToLogin=(response)=>{assert.ok(response.status>=300&&response.status<400,`esperava redirecionamento, recebeu ${response.status}`);assert.equal(new URL(response.headers.get('location'),base).pathname,'/admin/login');};

// Sem sessão válida, nada da administração é liberado.
assertRedirectsToLogin(await adminPage());
assertRedirectsToLogin(await adminPage('newpay_admin_session=forjada'));

// Credenciais negadas não liberam acesso nem criam sessão.
for(const credentials of [{email,password:'senha-incorreta-123'},{email:'ninguem@sites.test',password}]){
 const denied=await post('/api/admin/login',credentials);
 assert.equal(denied.status,401);
 assert.equal((await denied.json()).error,'E-mail ou senha incorretos.');
 assert.equal(denied.headers.get('set-cookie'),null);
}
assert.equal((await post('/api/admin/login',{})).status,400);
assert.equal((await post('/api/admin/login',{email,password},{origin:'https://other.test'})).status,403);

// Tentativas repetidas são bloqueadas, mesmo para e-mails inexistentes.
const target=`bloqueio-${crypto.randomUUID()}@sites.test`;
for(let i=0;i<5;i++)assert.equal((await post('/api/admin/login',{email:target,password:'senha-incorreta-123'})).status,401);
assert.equal((await post('/api/admin/login',{email:target,password:'senha-incorreta-123'})).status,429);

// O código de configuração é exigido e validado.
assert.equal((await post('/api/admin/setup',{code:'codigo-invalido',email:'novo@sites.test',password:'uma-senha-bem-longa'})).status,403);
assert.equal((await post('/api/admin/setup',{code:'codigo-invalido',email:'novo@sites.test',password:'curta'})).status,400);
assert.equal((await post('/api/admin/login',{email:'novo@sites.test',password:'uma-senha-bem-longa'})).status,401);

// Credenciais válidas abrem a administração.
const login=await post('/api/admin/login',{email:` ${email.toUpperCase()} `,password});
assert.equal(login.status,200);
const setCookie=login.headers.get('set-cookie');
assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Lax/);
const cookie=setCookie.split(';')[0];
assert.equal((await adminPage(cookie)).status,200);
const headers={origin:base,cookie,'content-type':'application/json'};

const id=crypto.randomUUID();
const sample={id,seller:'edioneide',quantity:40,date:'2026-11-04',note:'Registro descartável do teste local'};
assert.equal((await post('/api/sales',sample,{cookie:''})).status,401);
assert.equal((await post('/api/sales',sample,{cookie:'newpay_admin_session=forjada'})).status,401);
assert.equal((await post('/api/sales',sample,{cookie:'','oai-authenticated-user-id':'forjado'})).status,401);
try {
 for(let i=0;i<2;i++)assert.equal((await fetch(base+'/api/sales',{method:'POST',headers,body:JSON.stringify(sample)})).status,200);
 const records=await (await fetch(base+'/api/sales',{headers:{cookie}})).json();
 assert.equal(records.filter(s=>s.id===id).length,1);
 assert.equal(records.find(s=>s.id===id).quantity,40);
 assert.equal(records.find(s=>s.id===id).note,sample.note);
 const publicRecords=await (await fetch(base+'/api/sales')).json();
 assert.equal(publicRecords.find(s=>s.id===id).quantity,40);
 assert.equal(publicRecords.find(s=>s.id===id).note,'');
 for(const quantity of [0,-1,1.5,1001])assert.equal((await fetch(base+'/api/sales',{method:'POST',headers,body:JSON.stringify({...sample,id:crypto.randomUUID(),quantity})})).status,400);
 const cross=await fetch(base+'/api/sales',{method:'POST',headers:{...headers,origin:'https://other.test'},body:JSON.stringify(sample)});
 assert.equal(cross.status,403);
 assert.equal((await fetch(base+'/api/sales?id='+id,{method:'DELETE',headers:{origin:base}})).status,401);
} finally {
 const removed=await fetch(base+'/api/sales?id='+id,{method:'DELETE',headers});
 assert.equal(removed.status,200);
}
assert.ok(!(await (await fetch(base+'/api/sales')).json()).some(s=>s.id===id));

// Sair invalida a sessão no servidor, mesmo que o cookie antigo seja reenviado.
assert.equal((await post('/api/admin/logout',undefined,{cookie})).status,200);
assertRedirectsToLogin(await adminPage(cookie));
assert.equal((await post('/api/sales',{...sample,id:crypto.randomUUID()},{cookie})).status,401);
console.log('API local verificada: login, bloqueio de tentativas, proteção da página, sessão, persistência, idempotência, validação, origem, exclusão e saída.');
