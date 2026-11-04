# NewPay · Black Friday 2026

Campanha: `/`. Administração: `/admin`.

Registre vendedor, quantidade e data. O ranking, a meta do time e os bônus são recalculados automaticamente. A página consulta atualizações a cada 15 segundos. É possível excluir lançamentos e exportar CSV. Vendas são persistidas em Cloudflare D1; o navegador não é o banco de dados.

As cinco metas somam 110 máquinas. A surpresa exige que todos atinjam suas metas individuais. Os bônus são não cumulativos e o fixo de R$ 1.000 da Edioneide não é somado ao campo de bônus. Netinho permanece com bônus a definir. Participação de Daiara, Sabrina e Larissa é opcional.

## Acesso

`/admin` e as gravações de vendas exigem login de administrador com e-mail e senha, verificado no servidor. Sem sessão válida, `/admin` redireciona para `/admin/login`. Credenciais incorretas mostram erro e não liberam acesso. A sessão dura 8 horas e cinco tentativas erradas bloqueiam o par e-mail/IP por 15 minutos. A leitura pública de vendas não inclui as observações.

O acesso é `admin@gmail.com`, criado pela migração `drizzle/0003_seed_admin.sql`. Como este repositório é público, ela contém só o hash PBKDF2 de uma senha inicial longa e aleatória; a senha em si nunca é versionada. Depois de entrar, troque-a em `/admin/senha`, com no mínimo 8 caracteres. A troca encerra as sessões de outros dispositivos.

Não há recuperação de senha pela interface. Para redefinir uma senha perdida, é preciso atualizar o hash em `admin_users` com uma nova migração.

## Desenvolvimento

`npm run dev` inicia a prévia. `npm run build` compila. `node scripts/check-rules.mjs` verifica regras de negócio. Gerar migrações com `npm run db:generate`; publicar pelo fluxo Sites. Configurações e vinculação D1 estão em `.openai/hosting.json`.

## Executar com Docker

Use esta opção quando a prévia não iniciar no Windows com um erro de "access violation", causado por um Microsoft Visual C++ Redistributable desatualizado, ou quando não houver Node.js na máquina.

```sh
docker compose up -d --build
```

Abra `http://localhost:8787/admin` e entre com o administrador. As migrações são aplicadas a cada início do contêiner. Os dados ficam no volume `newpay-data`: `docker compose down` os preserva e `docker compose down -v` os apaga. Depois de alterar o código, rode `docker compose up -d --build` de novo.

O contêiner serve o build de produção pelo `wrangler dev`, com D1 local, e só aceita conexões da própria máquina. Ele não substitui a hospedagem: para expô-lo na rede seria preciso um proxy reverso com HTTPS e ajustar a verificação de origem.

```sh
docker compose exec -e BASE_URL=http://127.0.0.1:8787 -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... app node scripts/check-api-local.mjs
```

## Executar localmente

Requisitos: Node.js 22.13 ou superior e npm.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_korvac.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_nebulous_snowbird.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_remove_setup_codes.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_seed_admin.sql
npm run dev
```

A prévia abre em `http://127.0.0.1:5173`. A administração fica em `/admin`.

```sh
node scripts/check-rules.mjs
ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/check-api-local.mjs
```

O segundo teste exige a prévia local em execução e a senha do administrador local. Ele cria e remove somente seu próprio registro descartável, e troca a senha temporariamente, restaurando-a no final.

O repositório contém código e migrações de estrutura. Dados de vendas, credenciais, dependências e arquivos gerados ficam fora do versionamento.

Detalhes da infraestrutura: [README-SITES.md](README-SITES.md).
