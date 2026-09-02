# CLAUDE.md

Guia do repositório para o Claude Code (claude.ai/code).

## Visão geral

Landing page estática da **Vertus Mob** — unidade de mobilidade elétrica da Vertus Solar. Vende a **simulação** de um eletroposto próprio (com ou sem usina solar integrada) para investidores e donos de local no Ceará. Produto de alto ticket (R$ 60 mil a R$ 350 mil). O objetivo da página é gerar o lead para a simulação, não vender o produto direto.

Domínio: `vertus-mob.com`. Deploy: Vercel via integração Git (push em `main` publica). `www.vertus-mob.com` redireciona para o apex (regra em `vercel.json`).

Manual da submarca (fonte de verdade visual): skill `vertus-mob-design` em `~/.claude/skills/vertus-mob-design/SKILL.md`. Grafia sempre **Vertus Mob** (nunca "Vertus MOB"). Endosso textual: "Uma unidade Vertus Solar". Tagline: "Do sol para a estrada." Descritor: "Eletropostos próprios · Energia solar integrada · Gestão Vertus".

## Deploy

```bash
git add <arquivos>
git commit -m "mensagem"
git push origin main   # a Vercel detecta e publica
```

Não usar `vercel --prod` pela CLI — a conta da CLI está em outro tenant (`energycyclo-2615`). Sempre via Git. Ao mudar CSS/JS, subir o `?v=` em `index.html` (hoje `?v=7`).

## Arquitetura

Sem framework, sem build. Arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Página inteira. Head com JSON-LD (LocalBusiness + FAQPage). |
| `styles.css` | Único CSS: tokens, `@font-face` (Archivo variável self-hosted), componentes, seções na ordem da página, responsivo (1199 / 960 / 720 / 420 px), reduced-motion. |
| `app.js` | Comportamento: gtag após o load, reveal, navbar/menu, gate de WhatsApp + toast, máscara e validação de telefone, formulário do hero em 2 etapas (mobile), envio (Sheet + CRM), ticker, vídeo do #sobre, Google Maps. |
| `obrigado.html` | Thank-you page. CSS próprio inline. **Único lugar que dispara a conversão do Google Ads.** Monta o link do WhatsApp a partir do `sessionStorage` e o limpa. |
| `privacidade.html` | Política de privacidade (LGPD). CSS próprio inline. |
| `vercel.json` | Redirect www→apex, cache headers, `X-Robots-Tag` no obrigado. |
| `.vercelignore` | Exclui do deploy fotos brutas, `proposta/`, `assets/unidades/` (fachadas Cyclo — **não usar** na Mob), `fundo_hero.mp4` (vídeo antigo do hero, não referenciado). |
| `site.webmanifest`, `robots.txt`, `sitemap.xml` | Atualizar `<lastmod>` do sitemap a cada deploy relevante. |

Assets de marca em `assets/`: `logo-vertus-mob.svg` (laranja, nav), `logo-vertus-mob-branca.svg` (rodapé), `icone-carga.svg`, `linha-de-carga{,-100,-bg,-mini}.svg`, `favicon-{32,180,192,512}.png`, `totem-vertus-mob{,-sm}.webp` (carregador 120 kW com marca Mob, fundo transparente), `og-vertus-mob.jpg` (1200×630). Fonte em `assets/fonts/archivo-{latin,latin-ext}.woff2`. Thumbs das notícias em `press/2026-*.webp` (640×400).

## Ordem das seções (`index.html`)

1. `nav` — logo Mob, links, CTA "Quero minha simulação" (visível também no mobile), hambúrguer.
2. `#inicio` (hero) — fundo preto + padrão Linha de Carga, totem Mob (≥1200 px; versão pequena no mobile), H1 com tarja em "Sem franquia.", formulário `#heroLeadForm` (2 etapas só ≤720 px).
3. `#credenciais` — 7 anos · +1.000 instalações · +40 usinas · +10 eletropostos · 100% operação própria.
4. `#mercado` — ticker "Radar 2026", 3 números do mercado com fonte e data, 8 cards de notícias de 2026 (carrossel ≤720 px). Todas as fontes verificadas em 02/09/2026.
5. `#diferencial` — 6 cards numerados + tabela "eletroposto próprio × marca de terceiros".
6. `#como-funciona` — 5 etapas + prazo típico (~60 dias).
7. `#usina-eletroposto` — por que gerar a energia que o carregador consome (compensação por GD, sem números de margem).
8. `#para-quem` — 6 segmentos + CTA.
9. `#equipamentos` — 30 / 60 / 120 kW (NeoCharge, fotos reais do fornecedor), faturamento bruto estimado com tarifa de referência R$ 1,99/kWh, CTA. Carrossel ≤720 px.
10. `#mapa` — Google Maps (só RMF no enquadramento inicial, maxZoom 13), fallback estático `assets/mapa-fallback.webp`, stats operacionais, lista de pontos.
11. `#sobre` — vídeo `carro_chegando.mp4` (só desktop; imagem no mobile), copy "Uma unidade Vertus Solar".
12. `#faq` — 11 perguntas (`<details name="faq">`), espelhadas no JSON-LD FAQPage.
13. `#contato` — formulário `#leadForm` + foto da consultora (desktop) / linha compacta (mobile).
14. `footer` — logo branca, tagline, descritor, Linha de Carga 100%, "Uma unidade Vertus Solar", política de privacidade.
15. `.float-whatsapp` — some enquanto um formulário está na tela.

## Formulários e integrações

Dois formulários com a mesma lógica (`attachSubmit` em `app.js`): `#heroLeadForm` (campos `hlf-*`, origem `hero`) e `#leadForm` (campos `lf-*`, origem `contato`). Campos: nome, whatsapp, cidade, profissao, interesse, `pretencao` (grafia errada mantida de propósito: é o nome da coluna na planilha do Apps Script — não renomear sem ajustar o script).

Fluxo do envio: validação (telefone com máscara `(DD) 9XXXX-XXXX`, 10–11 dígitos) → abre aba do WhatsApp dentro do gesto (placeholder com marca) → salva `sessionStorage.vertusLead` → POST em paralelo para a planilha (`SHEET_URL`) e para o CRM (`https://crm-vertus.vercel.app/api/lead`, com UTMs/gclid/fbclid e campo `Origem`) com timeout de 6 s → aba recebe `wa.me` com mensagem pré-preenchida → redireciona para `/obrigado.html` (`?wa=1` se o pop-up foi bloqueado). Honeypot `name="site"` + envio em menos de 3 s = não envia (mas redireciona).

**Google Ads** `AW-17006818606`: `gtag('config')` inline no head; `gtag.js` injetado após o `load`. A conversão dispara **apenas** no carregamento de `obrigado.html` (uma por lead).

**WhatsApp**: número único em `<body data-wa-number="5588992877126" data-wa-display="(88) 99287-7126">` — o JS preenche `.js-wa-display`. Trocado de (85) 99431-4967 para (88) 99287-7126 no commit `a3d4287`; o manual da submarca ainda cita o (85) — confirmar com o dono qual é o canônico antes de "corrigir" qualquer um dos dois.

**Gate de WhatsApp** (decisão de produto, commit `a3d4287`): links e botão flutuante `.js-wa-gate` não abrem o WhatsApp — rolam até o formulário mais próximo e mostram o toast. Os rótulos dizem isso no `aria-label`.

**Google Maps**: `initVertusMap()` em `app.js`, carregado ao se aproximar de `#mapa`. Chave pública no `app.js` — recomendado restringir por referrer no Cloud Console. `google.maps.Marker` é legado (aviso de deprecação no console; migrar para AdvancedMarkerElement exige Map ID com estilo escuro no Cloud).

## Padrões de CSS

- Tokens em `:root` no topo de `styles.css` (`--vertus-*`, `--line`, `--card-bg`, `--radius-card` 12 px, `--radius-ctl` 8 px). Sem glows, sem text-shadow, sem degradê colorido; a única sombra é `--shadow-soft`.
- Bordas de card neutras (`--line`); laranja só em hover, no card em destaque e nos números principais. Pesos 400–800 (nunca 900).
- Elementos de marca: `.tarja` (1 a 3 palavras da headline), `.lc` / `.lc-mini` (Linha de Carga), `.section-kicker` como abertura de seção.
- Reveal: `data-reveal` + `.js` no `<html>` (sem JS tudo aparece). `.stagger` escalona filhos.
- Seções: `.<nome>-section` + `.grain`; `section-head` / `section-title` / `section-desc`.

## Regras de conteúdo

- **Não detalhar taxas, percentuais de retorno, payback ou remuneração** — isso é reunião. As faixas de faturamento bruto por carregador foram decisão do dono; não criar novos números.
- **"Franquia" só negada** ("sem franquia", "não somos franquia").
- CTAs: "Quero minha simulação" / "Receba sua simulação gratuita"; secundário "Falar pelo WhatsApp". Nunca "Conversar agora", "Falar com consultor" ou genéricos.
- Gestão Vertus é **opcional** — nunca escrever como padrão. Sem "grátis" como isca, sem urgência falsa, sem promessa de ganho.
- Energia: a usina **compensa** o consumo do eletroposto (créditos de geração distribuída) — não escrever "a energia que você vende é gerada por você".
- Vocabulário: eletroposto (não estação), recarga (serviço) / carregador (equipamento), carro elétrico (não "EV"), simulação (não orçamento/cotação), "24 h" com espaço, "30 kW" com espaço.
- Só Archivo; só a paleta Vertus. Verde apenas no botão flutuante e nos ícones de WhatsApp (ícone preto sobre verde, por contraste).
- Fotos: nunca usar `assets/unidades/` (fachadas da Cyclo Energy) nem `logo-cyclo.png` / `logo-solure.png` em material Mob.

## Débitos e pendências conhecidas

- E-mail `contato@vertussolar.com` foi removido do rodapé: o domínio não tem registro MX (verificado em 02/09/2026). Recolocar só quando existir caixa funcional.
- CNPJ, endereço e Instagram não estão no rodapé — faltam dados confirmados pelo dono.
- Prazo "cerca de 60 dias" e os tempos de recarga nos cards (Dolphin Mini 10–80% em ~50 min a 30 kW; bateria de 60 kWh 10–80% em ~30 min a 120 kW) são estimativas técnicas — validar com o dono/NeoCharge.
- Fotos reais dos eletropostos em operação (CJA, Pamil, Cometa) enriqueceriam a prova social; a página está preparada para recebê-las no `#sobre`/`#mapa`.
