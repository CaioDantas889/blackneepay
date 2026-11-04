# NewPay · Black Friday 2026

Campanha: `/`. Administração: `/admin`.

Registre vendedor, quantidade e data. O ranking, a meta do time e os bônus são recalculados automaticamente. A página consulta atualizações a cada 15 segundos. É possível excluir lançamentos e exportar CSV. Vendas são persistidas em Cloudflare D1; o navegador não é o banco de dados.

As cinco metas somam 110 máquinas. A surpresa exige que todos atinjam suas metas individuais. Os bônus são não cumulativos e o fixo de R$ 1.000 da Edioneide não é somado ao campo de bônus. Netinho permanece com bônus a definir. Participação de Daiara, Sabrina e Larissa é opcional.

## Acesso

Publicação inicial privada, protegida pelo login da plataforma Sites. Administração depende dessa barreira privada e exige identidade nas gravações. Antes de abrir a campanha ao público ou a vendedores, configurar autorização separada de administrador no servidor; não alterar o público do site sem essa etapa.

## Desenvolvimento

`npm run dev` inicia a prévia. `npm run build` compila. `node scripts/check-rules.mjs` verifica regras de negócio. Gerar migrações com `npm run db:generate`; publicar pelo fluxo Sites. Configurações e vinculação D1 estão em `.openai/hosting.json`.

## Executar localmente

Requisitos: Node.js 22.13 ou superior e npm.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_korvac.sql
npm run dev
```

A prévia abre em `http://127.0.0.1:5173`. Para testar a administração local, acesse `/signin-with-chatgpt?return_to=/admin`. Esse login simulado funciona apenas no desenvolvimento local.

```sh
node scripts/check-rules.mjs
node scripts/check-api-local.mjs
```

O segundo teste exige a prévia local em execução e cria e remove somente seu próprio registro descartável.

O repositório contém código e migrações de estrutura. Dados de vendas, credenciais, dependências e arquivos gerados ficam fora do versionamento.

Detalhes da infraestrutura: [README-SITES.md](README-SITES.md).
