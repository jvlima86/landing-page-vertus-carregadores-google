/* Vertus — landings de anúncio (Meta Ads): formulário de qualificação em etapas
   Configuração única abaixo. Cada página informa o produto em <body data-lp data-source-name data-brand>. */
(function () {
  'use strict';

  /* ══════════════ CONFIGURAÇÃO ══════════════ */
  const CONFIG = {
    // Pixel da Meta (Eventos: PageView na abertura, Lead na página de obrigado). Deixe vazio para desativar.
    metaPixelId: '',
    // CRM Vertus — recebe todos os leads com as respostas de qualificação (campo "Respostas do formulário").
    crmBase: 'https://crm-vertus.vercel.app',
    // Planilha atual (Apps Script já em uso pelo site principal) — recebe as colunas padrão.
    legacySheetUrl: 'https://script.google.com/macros/s/AKfycbwYLt1SL4Vry6mhzIhLUWZKWpDiwmRkI_wosoPBaGGjJn3DLe6AuBmbCeDkWeib42iW/exec',
    // Planilha dedicada às landings (opcional): publique lp/apps-script/Code.gs como app da web e cole a URL aqui.
    lpSheetUrl: '',
    // WhatsApp da Vertus (usado na página de obrigado).
    waNumber: '5588992877126',
    waDisplay: '(88) 99287-7126',
    timeoutMs: 6000,
  };
  /* ══════════════════════════════════════════ */

  const body = document.body;
  const page = body.dataset.page || 'lp';
  const params = new URLSearchParams(window.location.search);

  /* ── Meta Pixel (só se configurado) ── */
  if (CONFIG.metaPixelId) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CONFIG.metaPixelId);
    window.fbq('track', 'PageView');
  }

  document.querySelectorAll('.js-wa-display').forEach((el) => { el.textContent = CONFIG.waDisplay; });

  /* ════════ Página de obrigado ════════ */
  if (page === 'obrigado') {
    let lead = null;
    try { lead = JSON.parse(sessionStorage.getItem('vertusLpLead') || 'null'); } catch (_) {}
    const nameEl = document.querySelector('[data-lead-name]');
    if (nameEl && lead && lead.nome) nameEl.textContent = lead.nome.trim().split(' ')[0] + ', sua';
    const NOMES = { eletroposto: 'eletroposto próprio', usina: 'usina solar de investimento' };
    const lpParam = params.get('lp') || '';
    const wa = document.getElementById('tyWa');
    if (wa) {
      const produto = (lead && lead.produto) || NOMES[lpParam] || '';
      const msg = 'Olá! Acabei de pedir minha simulação' + (produto ? ' de ' + produto : '') + ' no site da Vertus e quero saber mais.' + (lead && lead.nome ? '\n\nNome: ' + lead.nome : '');
      wa.href = 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(msg);
    }
    const back = document.querySelector('[data-back-site]');
    if (back) { if (lpParam === 'eletroposto') back.href = 'https://vertus-mob.com/'; else back.hidden = true; }
    // Conversão da Meta: uma vez por lead (sessionStorage) — com ?ok=1 como sinal reserva
    try {
      const already = sessionStorage.getItem('vertusLpConv');
      const isLead = !!lead || params.get('ok') === '1';
      if (isLead && !already) {
        sessionStorage.setItem('vertusLpConv', '1');
        if (window.fbq) window.fbq('track', 'Lead', { content_name: (lead && lead.produto) || NOMES[lpParam] || 'lp' });
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'lead_meta_lp', lp: (lead && lead.lp) || lpParam });
      }
      sessionStorage.removeItem('vertusLpLead');
    } catch (_) {}
    return;
  }

  /* ════════ Landing: formulário em etapas ════════ */
  const form = document.getElementById('qualForm');
  if (!form) return;
  const steps = Array.from(form.querySelectorAll('.qf-step'));
  const progress = form.querySelector('.qf-progress');
  const progressLabel = form.querySelector('.qf-progress-label');
  const errorBox = form.querySelector('.qf-error-box');
  const card = form.closest('.qf-card') || form;
  const lpKey = body.dataset.lp || 'lp';
  const sourceName = body.dataset.sourceName || 'Meta Ads';
  const produto = body.dataset.produto || lpKey;
  let current = 0;
  let submitting = false;
  let started = false;
  const scrollBehavior = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  // Barra de progresso (uma célula por etapa)
  if (progress) {
    progress.innerHTML = steps.slice(0, -1).map(() => '<span></span>').join('');
  }
  function render() {
    steps.forEach((s, i) => s.classList.toggle('active', i === current));
    if (progress) Array.from(progress.children).forEach((c, i) => c.classList.toggle('done', i <= current));
    if (progressLabel) progressLabel.textContent = current < steps.length - 1
      ? 'Pergunta ' + (current + 1) + ' de ' + (steps.length - 1)
      : 'Último passo · seus dados';
    const q = steps[current].querySelector('.qf-q');
    if (q && started) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
    const first = steps[current].querySelector('input:not([type="radio"]), select');
    if (first && started && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  }
  function go(i) {
    started = true;
    current = Math.max(0, Math.min(steps.length - 1, i));
    render();
    if (current > 0) card.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'qual_step', lp: lpKey, step: current + 1 });
  }

  // Opções: avança ao tocar/clicar na opção (também se já estiver marcada); pelo teclado, Enter avança
  form.querySelectorAll('.qf-opt input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => clearStepError(r.closest('.qf-step')));
  });
  form.querySelectorAll('.qf-opt label').forEach((l) => {
    l.addEventListener('click', () => {
      const r = document.getElementById(l.htmlFor);
      const stepEl = l.closest('.qf-step');
      setTimeout(() => { if (r && r.checked && steps.indexOf(stepEl) === current) go(current + 1); }, 200);
    });
  });
  // Enter em campo de texto vai para o próximo campo; no último, envia
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('input[enterkeyhint="next"]')) return;
    e.preventDefault();
    const f = Array.from(steps[current].querySelectorAll('input:not([tabindex="-1"])'));
    const n = f[f.indexOf(e.target) + 1];
    if (n) n.focus(); else form.requestSubmit();
  });
  form.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => { if (validateStep(steps[current])) go(current + 1); }));
  form.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => go(current - 1)));

  /* ── Validação ── */
  function maskPhone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (!d.length) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  const phoneValid = (v) => { const d = v.replace(/\D/g, ''); return d.length === 10 || d.length === 11; };
  form.querySelectorAll('input[data-phone]').forEach((inp) => {
    inp.addEventListener('input', () => { inp.value = maskPhone(inp.value); clearError(inp); });
  });
  form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]').forEach((f) => f.addEventListener('input', () => clearError(f)));

  function setError(field, msg) {
    clearError(field);
    const p = document.createElement('p');
    p.className = 'field-error'; p.id = field.id + '-err'; p.setAttribute('role', 'alert'); p.textContent = msg;
    field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', p.id);
    field.parentNode.appendChild(p);
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby');
    const old = field.parentNode.querySelector('.field-error'); if (old) old.remove();
  }
  function clearStepError(stepEl) { const e = stepEl.querySelector('.qf-step-error'); if (e) e.remove(); }
  function validateStep(stepEl) {
    clearStepError(stepEl);
    const radios = stepEl.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      const name = radios[0].name;
      if (!form.querySelector('input[name="' + name + '"]:checked')) {
        const p = document.createElement('p'); p.className = 'field-error qf-step-error'; p.setAttribute('role', 'alert'); p.textContent = 'Escolha uma opção para continuar.';
        stepEl.querySelector('.qf-opts').after(p);
        return false;
      }
      return true;
    }
    let firstBad = null;
    stepEl.querySelectorAll('input[required], select[required]').forEach((f) => {
      const v = f.value.trim();
      const bad = !v || (f.dataset.phone !== undefined && !phoneValid(v)) || (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
      if (bad) {
        setError(f, f.dataset.phone !== undefined ? 'Informe um WhatsApp válido com DDD.' : f.type === 'email' ? 'Informe um e-mail válido.' : f.name === 'nome' ? 'Informe seu nome.' : 'Preencha este campo.');
        if (!firstBad) firstBad = f;
      }
    });
    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ── Envio ── */
  function withTimeout(ms) {
    if ('AbortSignal' in window && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal;
  }
  function collect() {
    const answers = {};
    steps.forEach((s) => {
      const r = s.querySelector('input[type="radio"]:checked');
      if (r) answers[s.dataset.label || r.name] = r.value;
    });
    const g = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
    return {
      answers,
      nome: g('nome'), whatsapp: g('whatsapp'), cidade: g('cidade'), email: g('email'),
    };
  }
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((k) => { const v = params.get(k); if (v) utm[k] = v; });

  async function postForm(url, data) {
    try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data), signal: withTimeout(CONFIG.timeoutMs) }); } catch (_) {}
  }
  async function postCRM(d) {
    try {
      const fields = Object.assign({}, d.answers);
      if (d.cidade) fields['Cidade'] = d.cidade;
      if (d.email) fields['E-mail'] = d.email;
      fields['Produto'] = produto;
      fields['Origem'] = 'Landing Meta Ads · ' + produto;
      await fetch(CONFIG.crmBase + '/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, signal: withTimeout(CONFIG.timeoutMs),
        body: JSON.stringify(Object.assign({
          phone: d.whatsapp, name: d.nome || undefined, sourceName, fields,
          referrer: document.referrer || undefined, landing_page: window.location.href,
        }, utm)),
      });
    } catch (_) {}
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (current < steps.length - 1) { if (validateStep(steps[current])) go(current + 1); return; }
    if (!validateStep(steps[current])) return;
    const btn = form.querySelector('.qf-submit');
    submitting = true;
    if (btn) { btn.dataset.originalHtml = btn.innerHTML; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Enviando…'; }
    if (errorBox) errorBox.classList.remove('show');

    const d = collect();
    const hp = form.querySelector('input[name="site"]');
    const suspicious = (hp && hp.value) || performance.now() < 2000;

    // Chaves compatíveis com a planilha atual + respostas completas para a planilha dedicada
    const flat = Object.assign({
      nome: d.nome, whatsapp: d.whatsapp, cidade: d.cidade, email: d.email,
      interesse: produto, profissao: d.answers['Perfil'] || d.answers['Local'] || d.answers['Tipo de local'] || '',
      pretencao: d.answers['Pretensão de investimento'] || '',
      origem: 'meta-' + lpKey, lp: lpKey, produto, pagina: window.location.href, data: new Date().toISOString(),
    }, d.answers, utm);

    if (!suspicious) {
      try { sessionStorage.setItem('vertusLpLead', JSON.stringify({ nome: d.nome, produto, lp: lpKey })); } catch (_) {}
      const jobs = [postCRM(d), postForm(CONFIG.legacySheetUrl, flat)];
      if (CONFIG.lpSheetUrl) jobs.push(postForm(CONFIG.lpSheetUrl, flat));
      await Promise.allSettled(jobs);
    }
    // Envio barrado pelo anti-spam redireciona sem marcar conversão (sem ?ok=1 e sem lead na sessão)
    window.location.href = 'obrigado.html?lp=' + encodeURIComponent(lpKey) + (suspicious ? '' : '&ok=1');
  });

  window.addEventListener('pageshow', (ev) => {
    if (!ev.persisted) return;
    submitting = false;
    const btn = form.querySelector('.qf-submit');
    if (btn && btn.dataset.originalHtml) { btn.innerHTML = btn.dataset.originalHtml; btn.removeAttribute('aria-busy'); }
  });

  /* ── CTA fixo some enquanto o formulário está na tela ── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => { body.classList.toggle('form-in-view', entries.some((en) => en.isIntersecting)); }, { threshold: 0.25 });
    obs.observe(card);
  }
  document.querySelectorAll('[data-scroll-form]').forEach((a) => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    card.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }));

  render();
})();
