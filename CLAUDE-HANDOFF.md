# Prompt de continuidade para Claude

Faça pull de CaioDantas889/blackneepay, branch main, e leia README e código antes de editar.

Pedido do usuário: ranking como primeira coisa no site; priorizar laranja e branco; animações na tabela e nas demais seções.

Já implementado: ranking movido para primeira seção real no JSX, tabela antes do pódio; placar compacto; paleta clara e laranja; animações de entrada das linhas, contagens atualizadas, liderança e seções por IntersectionObserver. Pausa e movimento reduzido preservados. Preservadas alterações remotas de autenticação admin, senha, Docker e migrações. Regras comerciais e dados não foram alterados.

TypeScript e testes de regras passaram. Compilação iniciada, confirmar resultado rodando npm run build. Página local respondeu HTTP 200. Revisão visual NÃO concluída: navegador expirou. Termine a revisão em 1440, 768, 390 e 320px; confira ranking primeiro, colunas, contraste, pódio com empates, ausência de rolagem horizontal, login/troca de senha e pausa de animações. Refatore duplicações ao final de app/globals.css se necessário. Não deixe dados fictícios no banco.

Valide: npm run build; node node_modules/typescript/bin/tsc --noEmit; node scripts/check-rules.mjs. Leia README e scripts/check-api-local.mjs antes do teste de API, que exige banco local migrado e servidor. Não executar migrações de produção, não expor credenciais e não publicar no Sites.

Finalize os ajustes, revise diff, faça commit e push normal para main, sem force, e confirme SHA remoto. Relate somente verificações realmente feitas.
