# NewPay · Black Friday 2026

Campanha: `/`. Administração: `/admin`.

Registre vendedor, quantidade e data. O ranking, a meta do time e os bônus são recalculados automaticamente. A página consulta atualizações a cada 15 segundos. É possível excluir lançamentos e exportar CSV. Vendas são persistidas em Cloudflare D1; o navegador não é o banco de dados.

As cinco metas somam 110 máquinas. A surpresa exige que todos atinjam suas metas individuais. Os bônus são não cumulativos e o fixo de R$ 1.000 da Edioneide não é somado ao campo de bônus. Netinho permanece com bônus a definir. Participação de Daiara, Sabrina e Larissa é opcional.

## Acesso

`/admin` e as gravações de vendas exigem login de administrador com e-mail e senha, verificado no servidor. Sem sessão válida, `/admin` redireciona para `/admin/login`. Credenciais incorretas mostram erro e não liberam acesso. A sessão dura 8 horas e cinco tentativas erradas bloqueiam o par e-mail/IP por 15 minutos. A leitura pública de vendas não inclui as observações.

As senhas ficam só no D1, como hash PBKDF2. Como este repositório é público, nenhuma credencial é versionada. Administradores são criados em `/admin/setup` com um código de uso único, que também serve para trocar a senha:

1. `npm run admin:code:publish` gera o código e uma migração contendo só o hash dele. Sem Node.js na máquina, use `docker compose run --rm -v "${PWD}/drizzle:/app/drizzle" app npm run admin:code:publish`. Na prévia local, use `npm run admin:code:local`.
2. Faça commit da migração e publique. O código aparece uma única vez no terminal e não deve ser versionado.
3. Abra `/admin/setup` e informe o código, o e-mail e a senha, com no mínimo 12 caracteres.

## Desenvolvimento

`npm run dev` inicia a prévia. `npm run build` compila. `node scripts/check-rules.mjs` verifica regras de negócio. Gerar migrações com `npm run db:generate`; publicar pelo fluxo Sites. Configurações e vinculação D1 estão em `.openai/hosting.json`.

## Executar com Docker

Use esta opção quando a prévia não iniciar no Windows com um erro de "access violation", causado por um Microsoft Visual C++ Redistributable desatualizado, ou quando não houver Node.js na máquina.

```sh
docker compose up -d --build
docker compose exec app npm run admin:code:local
```

Abra `http://localhost:8787/admin/setup` e crie o administrador com o código exibido no terminal. As migrações são aplicadas a cada início do contêiner. Os dados ficam no volume `newpay-data`: `docker compose down` os preserva e `docker compose down -v` os apaga. Depois de alterar o código, rode `docker compose up -d --build` de novo.

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
npm run admin:code:local
npm run dev
```

A prévia abre em `http://127.0.0.1:5173`. Para criar o administrador local, abra `/admin/setup` e use o código exibido no terminal.

```sh
node scripts/check-rules.mjs
ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/check-api-local.mjs
```

O segundo teste exige a prévia local em execução e um administrador local. Ele cria e remove somente seu próprio registro descartável.

O repositório contém código e migrações de estrutura. Dados de vendas, credenciais, dependências e arquivos gerados ficam fora do versionamento.

Detalhes da infraestrutura: [README-SITES.md](README-SITES.md).
