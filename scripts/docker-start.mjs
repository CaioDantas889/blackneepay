// Container entrypoint: applies pending D1 migrations, then serves the built Worker.
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import "./sites-env.mjs";

const wrangler = "node_modules/wrangler/bin/wrangler.js";
const config = "dist/server/wrangler.docker.json";
const state = ".wrangler/state";

// The generated config has no migrations_dir, which `d1 migrations apply` requires.
const generated = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
generated.d1_databases[0].migrations_dir = "../../drizzle";
writeFileSync(config, JSON.stringify(generated));

const migrated = spawnSync(
  process.execPath,
  [wrangler, "d1", "migrations", "apply", "DB", "--local", "--config", config, "--persist-to", state],
  { stdio: "inherit" },
);
if (migrated.status !== 0) process.exit(migrated.status ?? 1);

const server = spawn(
  process.execPath,
  [wrangler, "dev", "--config", config, "--local", "--persist-to", state, "--ip", "0.0.0.0", "--port", "8787", "--inspector-port", "0"],
  { stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
