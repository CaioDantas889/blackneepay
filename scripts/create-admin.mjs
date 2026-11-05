// Run inside the app container. Writes only to the mounted local database.
import { randomBytes, randomUUID, pbkdf2Sync } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import './sites-env.mjs';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (process.argv.length !== 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error('Uso: node scripts/create-admin.mjs email@exemplo.com');
  process.exit(1);
}
const config = 'dist/server/wrangler.docker.json';
if (!existsSync(config)) {
  console.error('Execute dentro do contêiner iniciado: docker compose exec app node scripts/create-admin.mjs email@exemplo.com');
  process.exit(1);
}
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16);
const hash = ['pbkdf2-sha256', '100000', salt.toString('hex'), pbkdf2Sync(password.normalize('NFKC'), salt, 100000, 32, 'sha256').toString('hex')].join('$');
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const directory = mkdtempSync(join(tmpdir(), 'newpay-admin-'));
let success = false;
try {
  const sql = join(directory, 'create.sql');
  writeFileSync(sql, `INSERT INTO admin_users (id,email,password_hash,created_at) VALUES (${[randomUUID(),email,hash,new Date().toISOString()].map(quote).join(',')});`, {mode:0o600});
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config',config,'--persist-to','.wrangler/state','--file',sql], {encoding:'utf8', env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  if (result.error || result.status !== 0) {
    console.error('Conta não criada. Confira se o e-mail já existe, se as migrações foram aplicadas e se o banco está acessível. Nenhuma senha existente foi substituída.');
    process.exitCode = 1;
  } else success = true;
} finally {
  rmSync(directory, {recursive:true,force:true});
}
if(success) {
  console.log(`Administrador criado: ${email}\nSenha temporária: ${password}\nGuarde a senha agora. Ela não será exibida novamente.\nEntre em /admin/login e troque a senha em /admin/senha.`);
}
