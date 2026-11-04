// Generates a single-use code for /admin/setup. Only the code's SHA-256 is stored,
// so the migration created by "publish" is safe to commit to a public repository.
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { projectRoot } from "./sites-env.mjs";

const mode = process.argv[2];
if (mode !== "local" && mode !== "publish") {
  console.error("Uso: npm run admin:code:local  |  npm run admin:code:publish");
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const code = randomBytes(20).toString("hex");
const codeHash = createHash("sha256").update(code).digest("hex");
const statement = `INSERT INTO admin_setup_codes (code_hash) VALUES ('${codeHash}');\n`;

if (mode === "local") {
  const config = "dist/server/wrangler.json";
  if (!existsSync(config)) {
    console.error(`${config} não encontrado. Execute "npm run build" e aplique as migrações antes.`);
    process.exit(1);
  }
  run([
    "node_modules/wrangler/bin/wrangler.js", "d1", "execute", "DB", "--local",
    "--config", config, "--persist-to", ".wrangler/state", "--command", statement,
  ]);
} else {
  run(["node_modules/drizzle-kit/bin.cjs", "generate", "--custom", "--name=admin_setup_code"]);
  const { entries } = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
  writeFileSync(`drizzle/${entries.at(-1).tag}.sql`, statement);
}

console.log(`
Código de configuração (uso único, não será exibido novamente):

  ${code}

${mode === "local"
  ? "Abra /admin/setup na prévia local e informe o código, o e-mail e a senha do administrador."
  : "Faça commit da nova migração e publique o site. Depois abra /admin/setup e informe o código, o e-mail e a senha do administrador."}
Guarde o código com segurança até usá-lo. Não o coloque no repositório.
`);
