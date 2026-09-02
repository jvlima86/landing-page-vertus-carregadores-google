/* Vertus Mob — vertus-mob.com — comportamento do cliente */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = window.matchMedia('(pointer: coarse)').matches;
  const body = document.body;

  /* ── Número de WhatsApp: fonte única em <body data-wa-number data-wa-display> ── */
  const WA_NUMBER = body.dataset.waNumber || '5588992877126';
  const WA_DISPLAY = body.dataset.waDisplay || '(88) 99287-7126';
  document.querySelectorAll('.js-wa-display').forEach((el) => { el.textContent = WA_DISPLAY; });

  /* ── Google Ads (gtag.js) depois do load — o dataLayer já está no <head> ── */
  function loadGtag() {
    if (window.__gtagLoaded) return;
    window.__gtagLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17006818606';
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') loadGtag();
  else window.addEventListener('load', loadGtag, { once: true });
  setTimeout(loadGtag, 2500);

  /* ── Reveal on scroll (com fallback) ── */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || REDUCED) {
    reveals.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach((el) => revealObs.observe(el));
  }

  /* ── Navbar ── */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    navLinks.classList.toggle('mobile-open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    body.classList.toggle('menu-open', open);
    if (open) {
      const first = navLinks.querySelector('a');
      if (first) first.focus();
    }
  }
  if (burger && navLinks) {
    burger.addEventListener('click', () => setMenu(!navLinks.classList.contains('mobile-open')));
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    navLinks.addEventListener('click', (e) => { if (e.target === navLinks) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) { setMenu(false); burger.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('mobile-open') && !nav.contains(e.target)) setMenu(false);
    });
  }

  /* ── Toast do gate de WhatsApp (criado no load para o aria-live funcionar) ── */
  const toast = document.createElement('div');
  toast.className = 'wa-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  body.appendChild(toast);
  let toastTimer = null;
  function showToast() {
    toast.innerHTML =
      '<div class="wa-toast-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg></div>' +
      '<div class="wa-toast-text"><strong>Preencha o formulário</strong><span>Para falar com a Vertus Mob pelo WhatsApp, complete os campos — a mensagem já vai com seus dados.</span></div>';
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 5200);
  }

  const heroForm = document.getElementById('heroLeadForm');
  const leadForm = document.getElementById('leadForm');

  function nearestForm(link) {
    const pref = link.dataset.waForm;
    if (pref && pref !== 'auto') return document.getElementById(pref);
    const mercado = document.getElementById('mercado');
    const y = window.scrollY + window.innerHeight / 2;
    return (mercado && y < mercado.offsetTop && heroForm) ? heroForm : (leadForm || heroForm);
  }
  function focusFirstEmpty(form) {
    const fields = form.querySelectorAll('input:not([name="site"]), select');
    for (const f of fields) {
      if (f.offsetParent !== null && !f.value) { f.focus({ preventScroll: true }); return; }
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.focus({ preventScroll: true });
  }
  document.querySelectorAll('.js-wa-gate').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = nearestForm(link);
      if (!form) return;
      form.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      showToast();
      if (!COARSE) setTimeout(() => focusFirstEmpty(form), REDUCED ? 0 : 700);
    });
  });

  /* ── Botão flutuante some enquanto um formulário está na tela ── */
  if ('IntersectionObserver' in window) {
    const visibleForms = new Set();
    const formObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) visibleForms.add(en.target); else visibleForms.delete(en.target); });
      body.classList.toggle('form-in-view', visibleForms.size > 0);
    }, { threshold: 0.2 });
    [heroForm, leadForm].forEach((f) => { if (f) formObs.observe(f); });
  }

  /* ── Máscara e validação ── */
  function maskPhone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (!d.length) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function phoneValid(v) {
    const d = v.replace(/\D/g, '');
    return d.length === 10 || d.length === 11;
  }
  document.querySelectorAll('input[data-phone]').forEach((inp) => {
    inp.addEventListener('input', () => { inp.value = maskPhone(inp.value); clearError(inp); });
  });
  document.querySelectorAll('form input, form select').forEach((f) => {
    f.addEventListener('input', () => clearError(f));
    f.addEventListener('change', () => clearError(f));
  });

  function errorFor(field) {
    if (field.dataset.phone !== undefined) return 'Informe um WhatsApp válido com DDD.';
    if (field.tagName === 'SELECT') return 'Selecione uma opção.';
    if (field.name === 'nome') return 'Informe seu nome.';
    if (field.name === 'cidade') return 'Informe sua cidade.';
    return 'Preencha este campo.';
  }
  function setError(field, msg) {
    clearError(field);
    const p = document.createElement('p');
    p.className = 'field-error';
    p.id = field.id + '-err';
    p.setAttribute('role', 'alert');
    p.textContent = msg;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', p.id);
    field.parentNode.appendChild(p);
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    const old = field.parentNode.querySelector('.field-error');
    if (old) old.remove();
  }
  function validate(fields) {
    let firstBad = null;
    fields.forEach((f) => {
      const v = f.value.trim();
      const bad = !v || (f.dataset.phone !== undefined && !phoneValid(v));
      if (bad) { setError(f, errorFor(f)); if (!firstBad) firstBad = f; }
    });
    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ── Formulário do hero em duas etapas (só no mobile, via CSS) ── */
  if (heroForm) {
    const label = heroForm.querySelector('[data-step-label]');
    const step1 = heroForm.querySelector('.hf-step[data-step="1"]');
    const step2 = heroForm.querySelector('.hf-step[data-step="2"]');
    const next = heroForm.querySelector('[data-next]');
    const back = heroForm.querySelector('[data-back]');
    if (next && step1 && step2) {
      next.addEventListener('click', () => {
        if (!validate(step1.querySelectorAll('input, select'))) return;
        heroForm.classList.add('step-2');
        if (label) label.textContent = 'Etapa 2 de 2 · quase lá';
        const f = step2.querySelector('input, select');
        if (f) f.focus({ preventScroll: true });
        heroForm.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      });
    }
    if (back) {
      back.addEventListener('click', () => {
        heroForm.classList.remove('step-2');
        if (label) label.textContent = 'Etapa 1 de 2 · menos de 1 minuto';
        const f = step1.querySelector('input');
        if (f) f.focus({ preventScroll: true });
      });
    }
  }

  /* ── Envio: planilha + CRM em paralelo, WhatsApp pré-preenchido, obrigado.html ── */
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwYLt1SL4Vry6mhzIhLUWZKWpDiwmRkI_wosoPBaGGjJn3DLe6AuBmbCeDkWeib42iW/exec';
  const CRM_BASE = 'https://crm-vertus.vercel.app';
  const TIMEOUT_MS = 6000;

  function withTimeout(ms) {
    if ('AbortSignal' in window && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  }
  async function sendToSheet(data) {
    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data),
        signal: withTimeout(TIMEOUT_MS),
      });
    } catch (_) {}
  }
  async function sendToCRM(data) {
    try {
      const qs = new URLSearchParams(window.location.search);
      const fields = {};
      if (data.cidade) fields['Cidade'] = data.cidade;
      if (data.profissao) fields['Profissão'] = data.profissao;
      if (data.interesse) fields['Interesse'] = data.interesse;
      if (data.pretencao) fields['Orçamento'] = data.pretencao;
      fields['Origem'] = data.origem === 'hero' ? 'Formulário do topo' : 'Formulário de contato';
      const payload = {
        phone: data.whatsapp,
        name: data.nome || undefined,
        sourceName: 'Landing Page Eletropostos',
        fields,
        utm_source: qs.get('utm_source') || undefined,
        utm_medium: qs.get('utm_medium') || undefined,
        utm_campaign: qs.get('utm_campaign') || undefined,
        utm_term: qs.get('utm_term') || undefined,
        utm_content: qs.get('utm_content') || undefined,
        fbclid: qs.get('fbclid') || undefined,
        gclid: qs.get('gclid') || undefined,
        referrer: document.referrer || undefined,
        landing_page: window.location.href || undefined,
      };
      await fetch(CRM_BASE + '/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: withTimeout(TIMEOUT_MS),
      });
    } catch (_) {}
  }

  function buildWaUrl(data) {
    const lines = [
      'Olá! Acabei de pedir minha simulação no site da Vertus Mob (vertus-mob.com) e quero saber mais sobre ter um eletroposto próprio.',
      '',
      'Nome: ' + (data.nome || '—'),
      'WhatsApp: ' + (data.whatsapp || '—'),
      'Cidade: ' + (data.cidade || '—'),
      'Profissão: ' + (data.profissao || '—'),
      'Interesse: ' + (data.interesse || '—'),
      'Pretensão de investimento: ' + (data.pretencao || '—'),
    ];
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function setBusy(form, btn, busy) {
    if (!btn) return;
    if (busy) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Enviando…';
    } else if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
    }
    const st = form.querySelector('[data-form-status]');
    if (st) st.textContent = busy ? 'Enviando sua simulação…' : '';
  }

  const PLACEHOLDER_HTML =
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Abrindo o WhatsApp…</title></head>' +
    '<body style="margin:0;background:#1E1C1C;color:#F1F1F1;font-family:Archivo,system-ui,sans-serif;display:grid;place-items:center;height:100vh;text-align:center">' +
    '<div><div style="width:44px;height:44px;border:3px solid rgba(255,126,39,.3);border-top-color:#FF7E27;border-radius:50%;margin:0 auto 18px;animation:s 1s linear infinite"></div>' +
    '<p style="font-size:18px;font-weight:700;margin:0 0 6px">Abrindo o WhatsApp da Vertus Mob…</p><p style="color:#9A9A9A;margin:0">Sua mensagem já vai pronta. É só confirmar o envio.</p></div>' +
    '<style>@keyframes s{to{transform:rotate(360deg)}}</style></body></html>';

  let submitting = false;
  function attachSubmit(form, origem) {
    if (!form) return;
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;
      const stepNext = form.querySelector('[data-next]');
      if (stepNext && window.matchMedia('(max-width: 720px)').matches && !form.classList.contains('step-2')) { stepNext.click(); return; }
      const fields = form.querySelectorAll('input[required], select[required]');
      if (!validate(fields)) {
        if (form.classList.contains('step-2')) {
          const bad = form.querySelector('[aria-invalid="true"]');
          if (bad && bad.closest('.hf-step[data-step="1"]')) {
            const back = form.querySelector('[data-back]');
            if (back) back.click();
            bad.focus({ preventScroll: true });
          }
        }
        return;
      }
      submitting = true;
      setBusy(form, btn, true);

      // Anti-spam: honeypot preenchido ou envio em menos de 3 s desde o carregamento
      const hp = form.querySelector('input[name="site"]');
      const suspicious = (hp && hp.value) || (performance.now() < 2000);

      const g = (id) => { const el = form.querySelector(id); return el ? el.value.trim() : ''; };
      const p = origem === 'hero' ? '#hlf-' : '#lf-';
      const data = {
        nome: g(p + 'name'),
        whatsapp: g(p + 'phone'),
        cidade: g(p + 'city'),
        profissao: g(p + 'profession'),
        interesse: g(p + 'interest'),
        pretencao: g(p + 'budget'),
        origem,
      };

      // Aba do WhatsApp aberta dentro do gesto do usuário (evita bloqueio de pop-up)
      let waWindow = null;
      try {
        waWindow = window.open('', '_blank');
        if (waWindow) { waWindow.document.open(); waWindow.document.write(PLACEHOLDER_HTML); waWindow.document.close(); }
      } catch (_) { waWindow = null; }

      try { sessionStorage.setItem('vertusLead', JSON.stringify(data)); } catch (_) {}

      if (!suspicious) await Promise.allSettled([sendToSheet(data), sendToCRM(data)]);

      const waUrl = buildWaUrl(data);
      let opened = false;
      if (waWindow && !waWindow.closed) {
        try { waWindow.location.href = waUrl; opened = true; } catch (_) { opened = false; }
      }
      // A conversão do Google Ads é registrada uma única vez, no carregamento de /obrigado.html
      window.location.href = '/obrigado.html' + (opened ? '' : '?wa=1');
    });
  }
  attachSubmit(heroForm, 'hero');
  attachSubmit(leadForm, 'contato');

  // Voltar do bfcache (Safari/iOS): restaura os botões
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    submitting = false;
    [heroForm, leadForm].forEach((f) => { if (f) setBusy(f, f.querySelector('button[type="submit"]'), false); });
  });

  /* ── Ticker: pausa fora da tela ── */
  const ticker = document.querySelector('.press-ticker');
  const track = document.querySelector('.press-ticker-track');
  if (ticker && track && 'IntersectionObserver' in window) {
    const tObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => track.classList.toggle('paused', !en.isIntersecting));
    }, { threshold: 0 });
    tObs.observe(ticker);
  }

  /* ── Vídeo do #sobre: só desktop, carregado ao entrar na tela ── */
  const aboutVideo = document.getElementById('aboutVideo');
  if (aboutVideo && aboutVideo.dataset.src) {
    const desktop = window.matchMedia('(min-width: 961px)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (desktop && !REDUCED && !saveData && 'IntersectionObserver' in window) {
      let loaded = false;
      const vObs = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            if (!loaded) {
              loaded = true;
              if (aboutVideo.dataset.poster) aboutVideo.poster = aboutVideo.dataset.poster;
              const src = document.createElement('source');
              src.src = aboutVideo.dataset.src;
              src.type = 'video/mp4';
              aboutVideo.appendChild(src);
              aboutVideo.load();
              aboutVideo.parentElement.classList.add('video-on');
            }
            aboutVideo.play().catch(() => {});
          } else if (loaded) {
            aboutVideo.pause();
          }
        });
      }, { threshold: 0.2, rootMargin: '300px 0px' });
      vObs.observe(aboutVideo);
    }
  }

  /* ── Google Maps: carrega ao se aproximar do #mapa ── */
  const gmap = document.getElementById('gmap');
  const mapOpen = gmap && gmap.querySelector('[data-map-open]');
  const mapOnDemand = window.matchMedia('(max-width: 720px)').matches || (navigator.connection && navigator.connection.saveData);
  if (gmap && mapOnDemand && mapOpen) {
    // Mobile / save-data: o mapa (≈1,2 MB) só carrega se o visitante pedir
    mapOpen.hidden = false;
    gmap.classList.add('map-ondemand');
    mapOpen.addEventListener('click', () => { mapOpen.hidden = true; loadVertusMap(); });
  } else if (gmap) {
    if ('IntersectionObserver' in window) {
      let started = false;
      const mObs = new IntersectionObserver((entries) => {
        if (started) return;
        if (entries.some((en) => en.isIntersecting)) { started = true; mObs.disconnect(); loadVertusMap(); }
      }, { rootMargin: '600px 0px' });
      mObs.observe(gmap);
    } else {
      loadVertusMap();
    }
  }
  function loadVertusMap() {
    if (window.__vertusMapsLoading) return;
    window.__vertusMapsLoading = true;
    ['https://maps.googleapis.com', 'https://maps.gstatic.com'].forEach((h) => {
      const l = document.createElement('link'); l.rel = 'preconnect'; l.href = h; document.head.appendChild(l);
    });
    window.gm_authFailure = () => gmap.classList.add('map-failed');
    const s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzn3uYW2NljaXXjcAV39Ad_yPwr9q1QXs&callback=initVertusMap&loading=async';
    s.async = true;
    s.defer = true;
    s.onerror = () => gmap.classList.add('map-failed');
    document.head.appendChild(s);
  }
})();

function initVertusMap() {
  const el = document.getElementById('gmap');
  if (!el || !window.google || !google.maps) return;
  el.querySelectorAll('.map-fallback, .map-fallback-img, [data-map-open]').forEach((n) => n.remove());
  el.classList.add('map-ready');

  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const DARK_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8f8f8f' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d0d0d0' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#383838' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d3d3d' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  ];

  const POINTS = [
    { name: 'CJA', lat: -3.752672, lng: -38.5516281, active: true, url: 'https://maps.app.goo.gl/RucaCwpC9zvBc5E46' },
    { name: 'Pamil', lat: -3.7408827, lng: -38.548699, active: true, url: 'https://maps.app.goo.gl/u45zsBXsUwPaBTW99' },
    { name: 'Cometa Barão do Rio Branco', lat: -3.7428723, lng: -38.5333842, active: true, url: 'https://maps.app.goo.gl/eudUGrN9tiMtGzEc8' },
    { name: 'Hotel Laranjeiras · Viçosa do Ceará', lat: -3.5603188, lng: -41.1067186, active: false, url: 'https://maps.app.goo.gl/qjYuREXHVSQjakh66' },
    { name: 'Moove Montese · 3 pontos', lat: -3.7553811, lng: -38.5414821, active: false, url: 'https://maps.app.goo.gl/nm7ceDKJs2TPhrdJ9' },
    { name: 'Grupo Cyclo', lat: -3.7894335, lng: -38.5854335, active: false, url: 'https://maps.app.goo.gl/Zpxp9ocJgXZB6t4B8' },
    { name: 'Mineiro Casa de Amigos · Pacoti', lat: -4.2252657, lng: -38.9239553, active: false, url: 'https://maps.app.goo.gl/pKFutvWuo41MMRSHA' },
    { name: 'Condomínio Alto do Parque', lat: -3.7478898, lng: -38.4752003, active: false, url: 'https://maps.app.goo.gl/tATcZqTie4jqoVwd7' },
    { name: 'Condomínio Hortus', lat: -3.7997332, lng: -38.5698613, active: false, url: 'https://maps.app.goo.gl/wCk3rErrtyNScsBo7' },
  ];

  const map = new google.maps.Map(el, {
    zoom: 12,
    center: { lat: -3.76, lng: -38.54 },
    styles: DARK_STYLE,
    disableDefaultUI: true,
    zoomControl: !isMobile,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    gestureHandling: 'cooperative',
    backgroundColor: '#1a1a1a',
  });

  const activeIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">' +
      '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#FF7E27"/>' +
      '<circle cx="18" cy="18" r="7" fill="#F1F1F1"/><circle cx="18" cy="18" r="3.5" fill="#FF7E27"/></svg>'),
    scaledSize: new google.maps.Size(36, 44),
    anchor: new google.maps.Point(18, 44),
  };
  const futureIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">' +
      '<path d="M15 1C7.28 1 1 7.28 1 15c0 11.25 14 22 14 22S29 26.25 29 15C29 7.28 22.72 1 15 1z" fill="none" stroke="#FF7E27" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.75"/>' +
      '<circle cx="15" cy="15" r="5" fill="none" stroke="#FF7E27" stroke-width="1.5" opacity="0.75"/></svg>'),
    scaledSize: new google.maps.Size(30, 38),
    anchor: new google.maps.Point(15, 38),
  };

  const infoWindow = new google.maps.InfoWindow();
  const metroBounds = new google.maps.LatLngBounds();

  POINTS.forEach((p) => {
    const pos = { lat: p.lat, lng: p.lng };
    const marker = new google.maps.Marker({ position: pos, map, icon: p.active ? activeIcon : futureIcon, title: p.name });
    const status = p.active
      ? '<span style="color:#FF7E27;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em">● Aberto ao público</span>'
      : '<span style="color:#FF9F54;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em">◌ Em contratação</span>';
    marker.addListener('click', () => {
      infoWindow.setContent(
        '<div style="font-family:Archivo,system-ui,sans-serif;background:#1E1C1C;color:#F1F1F1;padding:12px 14px;border-radius:8px;min-width:180px">' +
        '<div style="margin-bottom:6px">' + status + '</div>' +
        '<div style="font-size:0.92rem;font-weight:700;line-height:1.3;margin-bottom:10px">' + p.name + '</div>' +
        '<a href="' + p.url + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;font-weight:700;color:#FF7E27;text-decoration:none;border:1px solid rgba(255,126,39,0.4);border-radius:6px;padding:6px 10px">Ver no Google Maps ↗</a></div>');
      infoWindow.open(map, marker);
    });
    // Enquadra só a Região Metropolitana de Fortaleza; os demais aparecem ao afastar o zoom
    if (isMobile ? p.active : (Math.abs(p.lng + 38.54) < 0.25 && p.lat > -4.0)) metroBounds.extend(pos);
  });

  const maxZoom = isMobile ? 14 : 13;
  map.fitBounds(metroBounds, isMobile ? { top: 56, right: 40, bottom: 56, left: 40 } : { top: 48, right: 48, bottom: 64, left: 48 });
  google.maps.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > maxZoom) map.setZoom(maxZoom); });
}
