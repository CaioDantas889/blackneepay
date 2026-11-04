# NewPay · Black Friday 2026

Campanha: `/`. Administração: `/admin`.

Registre vendedor, quantidade e data. O ranking, a meta do time e os bônus são recalculados automaticamente. A página consulta atualizações a cada 15 segundos. É possível excluir lançamentos e exportar CSV. Vendas são persistidas em Cloudflare D1; o navegador não é o banco de dados.

As cinco metas somam 110 máquinas. A surpresa exige que todos atinjam suas metas individuais. Os bônus são não cumulativos e o fixo de R$ 1.000 da Edioneide não é somado ao campo de bônus. Netinho permanece com bônus a definir. Participação de Daiara, Sabrina e Larissa é opcional.

## Acesso

`/admin` e as gravações de vendas exigem login de administrador com e-mail e senha, verificado no servidor. O acesso é `admin@gmail.com` e a senha pode ser trocada em `/admin/senha`, com no mínimo 8 caracteres. Detalhes em [README.md](README.md#acesso).

## Desenvolvimento

`npm run dev` inicia a prévia. `npm run build` compila. `node scripts/check-rules.mjs` verifica regras de negócio. Gerar migrações com `npm run db:generate`; publicar pelo fluxo Sites. Configurações e vinculação D1 estão em `.openai/hosting.json`.
