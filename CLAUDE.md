# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing page estática da **Vertus Solar** — captura de leads de investidores para usinas solares + eletropostos no Ceará. Produto de alto ticket (R$50k–300k+); objetivo da página é vender a simulação financeira, não o produto diretamente.

Deploy: Vercel via Git integration (push para `main` dispara deploy automático). Domínio: `vertus-mob.com`.

## Deploy

```bash
git add <files>
git commit -m "mensagem"
git push origin main   # Vercel detecta e faz deploy automaticamente
```

Não usar `vercel --prod` via CLI — a conta CLI está em outro tenant (`energycyclo-2615`). Sempre usar o Git push.

## Arquitetura

Sem framework, sem build step. Cinco arquivos principais:

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Toda a página (~1340 linhas). Seções ordenadas pela jornada do investidor. |
| `styles.css` | Estilos principais (~1900 linhas). Design system dark-first. |
| `colors_and_type.css` | Tokens de cor e tipografia. Importado via `@import` dentro de `styles.css`. |
| `scene3d.css` | Animações neon/3D da seção de vantagem de custo. |
| `app.js` | Todo comportamento do cliente — scroll reveal, formulários, mapa, gráfico. |
| `obrigado.html` | Thank You Page pós-envio de formulário. CSS inline, sem dependência de `styles.css`. |

## Design System

Definido em `colors_and_type.css`. Variáveis principais:

```css
--vertus-orange: #FF7E27      /* CTA primário, accents */
--vertus-black: #1E1C1C       /* Background principal */
--vertus-charcoal: #2A2828    /* Cards, superfícies elevadas */
--vertus-muted: #9A9A9A       /* Texto terciário, labels */
```

Fonte: **Archivo** (400–900), carregada via Google Fonts no `<head>` do `index.html`. Classe `.grain` aplica textura de ruído via `::after` pseudo-elemento.

## Seções da Página (ordem)

1. **Hero** (`#hero`) — Layout split 55/45. Vídeo de fundo `fundo-site-transicao.mp4`. Formulário inline à direita.
2. **Mercado** (`#mercado`) — Press cards + ticker de manchetes.
3. **Números** (`#numeros`) — 3 stats: R$50k entrada, 25 anos, 3,5×.
4. **Pilares** (`#pilares`) — Usinas + Eletropostos.
5. **Como funciona** (`#como-funciona`) — Flow tabs: "Somente Usina" / "Usina + Eletroposto".
6. **Custo da energia** (`#custo`) — Animação neon 3D (scene3d.css).
7. **Comparativo** (`#comparativo`) — Renda Fixa vs. ativo real.
8. **Evolução do capital** (`#evolucao`) — Gráfico SVG animado.
9. **Timeline** (`#timeline`) — Dual-track: Usina Solar + Eletroposto, ~60 dias.
10. **Mapa** (`#mapa`) — Google Maps com marcadores customizados via JS API.
11. **Sobre** (`#sobre`) — Conteúdo pendente (informar ao usuário antes de editar).
12. **Contato** (`#contato`) — Formulário de lead + link WhatsApp.

## Formulários e Integrações

**Dois formulários** com a mesma lógica:
- `#heroLeadForm` (hero, campos: `hlf-*`)
- `#leadForm` (seção contato, campos: `lf-*`)

Ambos submetem via `fetch` POST para Google Apps Script (`SHEET_URL` em `app.js`), disparam `trackConversion()` e redirecionam para `/obrigado.html`.

**Google Ads**: `gtag('event','conversion',{'send_to':'AW-17006818606'})` — deve estar em todos os botões de WhatsApp e nos dois formulários. Também disparado no `<head>` de `obrigado.html`.

**Google Maps**: `initVertusMap()` em `app.js`, chave de API pública no `<script>` no fim do `index.html`.

**WhatsApp**: `(85) 99431-4967` → `https://wa.me/5585994314967`. Número único em todo o site.

## Padrões de CSS

- Classes de seção: `.<nome>-section` + `.grain`
- Reveal on scroll: atributo `data-reveal` no elemento → JS adiciona `.visible`
- Animações escalonadas: `data-reveal="3d"`, `data-reveal="scale"`, classe `.stagger`
- Responsivo: breakpoints em `960px`, `600px`, `480px` no fim de `styles.css`
- `will-change` aplicado apenas em elementos que animam com `transform` ou `filter`

## Regras de Conteúdo

- **Não detalhar taxas ou estrutura de remuneração** na página — esses números são apresentados em reunião com o investidor.
- **Não usar "franquia"** em nenhuma copy — diferencial explícito é "não somos franquia".
- CTAs principais: "Quero minha simulação" / "Receba sua simulação gratuita".
- CTA secundário: "Falar pelo WhatsApp" (nunca "Conversar agora" ou genéricos).
