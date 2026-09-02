# AGENTS.md

Guia do repositório para agentes de código (Codex e similares).

Este arquivo é um espelho do `CLAUDE.md`, que é a fonte de verdade. Leia `CLAUDE.md` para arquitetura, ordem das seções, fluxo dos formulários, integrações (Google Ads, CRM, planilha, WhatsApp, Google Maps), padrões de CSS, regras de conteúdo e pendências conhecidas.

Resumo do que não pode ser violado:

- Marca: **Vertus Mob** (nunca "Vertus MOB"), unidade da Vertus Solar. Logo Mob em `assets/logo-vertus-mob*.svg`.
- Deploy: `git push origin main` (Vercel). Nunca `vercel --prod` pela CLI.
- Conteúdo: sem taxas/retorno/payback na página; "franquia" só negada; CTAs "Quero minha simulação" / "Falar pelo WhatsApp"; gestão Vertus é opcional; a usina **compensa** o consumo do eletroposto.
- Conversão do Google Ads dispara só em `obrigado.html`.
- WhatsApp único em `<body data-wa-number data-wa-display>`.
- Não usar `assets/unidades/` (fotos da Cyclo Energy) em material Mob.
