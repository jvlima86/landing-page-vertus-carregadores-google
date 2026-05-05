/* Vertus Solar — Landing Page Behavior */
(function () {
  // Reveal on scroll
  const reveals = document.querySelectorAll('[data-reveal]');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(el => revealObs.observe(el));

  // Navbar scrolled effect
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Hamburger menu mobile
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('mobile-open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    // Fechar ao clicar num link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth scroll — expo ease-in-out
  let _scrollRaf = null;
  function smoothScrollTo(targetY, duration) {
    cancelAnimationFrame(_scrollRaf);
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    const t0 = performance.now();
    function step(now) {
      const t = Math.min((now - t0) / duration, 1);
      const e = t === 0 ? 0 : t === 1 ? 1
        : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
      window.scrollTo(0, startY + dist * e);
      if (t < 1) _scrollRaf = requestAnimationFrame(step);
    }
    _scrollRaf = requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 56;
        smoothScrollTo(top, 900);
      }
    });
  });

  // Flow tabs
  const flowBtns = document.querySelectorAll('.flow-toggle-btn');
  const flowUsina = document.getElementById('flow-usina');
  const flowEp = document.getElementById('flow-ep');
  let currentFlow = flowUsina;

  flowBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.flow;
      const next = (mode === 'usina') ? flowUsina : flowEp;
      if (next === currentFlow) return;
      flowBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFlow.classList.remove('flow-active');
      // Force reflow before adding active so transition replays
      void next.offsetWidth;
      next.classList.add('flow-active');
      currentFlow = next;
    });
  });

  // Google Ads conversion helper
  function trackConversion() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', { 'send_to': 'AW-17006818606' });
    }
  }

  // Envia lead para Google Sheets via Apps Script
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwYLt1SL4Vry6mhzIhLUWZKWpDiwmRkI_wosoPBaGGjJn3DLe6AuBmbCeDkWeib42iW/exec';

  async function sendToSheet(params) {
    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
    } catch (_) {}
  }

  // Hero form
  const heroForm = document.getElementById('heroLeadForm');
  const heroSuccess = document.getElementById('heroLeadSuccess');
  const heroBtn = heroForm && heroForm.querySelector('.hero-submit');

  if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (heroBtn) { heroBtn.disabled = true; heroBtn.textContent = 'Enviando…'; }

      const params = new URLSearchParams({
        nome:      heroForm.querySelector('#hlf-name').value,
        whatsapp:  heroForm.querySelector('#hlf-phone').value,
        cidade:    heroForm.querySelector('#hlf-city').value,
        interesse: heroForm.querySelector('#hlf-interest').value,
        pretencao: heroForm.querySelector('#hlf-budget').value,
        origem:    'hero',
      });

      await sendToSheet(params);
      trackConversion();
      window.location.href = '/obrigado.html';
    });
  }

  // Lead form (seção de contato)
  const form = document.getElementById('leadForm');
  const success = document.getElementById('leadSuccess');
  const submitBtn = form && form.querySelector('.lead-submit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

      const params = new URLSearchParams({
        nome:      form.querySelector('#lf-name').value,
        whatsapp:  form.querySelector('#lf-phone').value,
        cidade:    form.querySelector('#lf-city').value,
        interesse: form.querySelector('#lf-interest').value,
        pretencao: form.querySelector('#lf-budget').value,
        origem:    'contato',
      });

      await sendToSheet(params);
      trackConversion();
      window.location.href = '/obrigado.html';
    });
  }
})();

/* ── Capital evolution chart ── */
(function () {
  const chart = document.getElementById('capitalChart');
  if (!chart) return;

  let started = false;

  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      obs.disconnect();
      runChartAnimation();
    }
  }, { threshold: 0.35 });
  obs.observe(chart);

  function runChartAnimation() {
    const rfPath = document.getElementById('rfPath');
    const epPath = document.getElementById('epPath');
    if (!rfPath || !epPath) return;

    const rfLen = rfPath.getTotalLength();
    const epLen = epPath.getTotalLength();

    [rfPath, epPath].forEach(p => { p.style.transition = 'none'; });
    rfPath.style.strokeDasharray = rfLen;
    rfPath.style.strokeDashoffset = rfLen;
    epPath.style.strokeDasharray = epLen;
    epPath.style.strokeDashoffset = epLen;

    // Force reflow
    rfPath.getBoundingClientRect();

    // Animate both lines together
    requestAnimationFrame(() => {
      rfPath.style.transition = 'stroke-dashoffset 2.8s cubic-bezier(0.4,0,0.2,1)';
      rfPath.style.strokeDashoffset = 0;

      epPath.style.transition = 'stroke-dashoffset 3.2s cubic-bezier(0.16,1,0.3,1)';
      epPath.style.strokeDashoffset = 0;
    });

    // Fade in area fills
    setTimeout(() => {
      const rfArea = document.getElementById('rfArea');
      const epArea = document.getElementById('epArea');
      if (rfArea) { rfArea.style.transition = 'opacity 1.4s ease'; rfArea.style.opacity = 1; }
      if (epArea) { epArea.style.transition = 'opacity 1.4s ease'; epArea.style.opacity = 1; }
    }, 1200);

    // Show annotations in sequence
    const seq = [
      { id: 'crossoverGroup', delay: 2800 },
      { id: 'rfFinalGroup',   delay: 3100 },
      { id: 'rfLabelGroup',   delay: 3200 },
      { id: 'epFinalGroup',   delay: 3300 },
      { id: 'epLabelGroup',   delay: 3450 },
      { id: 'gapGroup',       delay: 3650 },
    ];
    seq.forEach(({ id, delay }) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = 1;
      }, delay);
    });
  }
})();

/* ── KPI counter animation ── */
(function () {
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimal || '0');
    const duration = 1800;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      const display = decimals > 0
        ? val.toFixed(decimals).replace('.', ',')
        : Math.round(val).toString();
      el.textContent = prefix + display;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + (decimals > 0
          ? target.toFixed(decimals).replace('.', ',')
          : target.toString());
      }
    }
    requestAnimationFrame(tick);
  }

  const stats = document.querySelectorAll('.num-stat[data-reveal]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.count-num[data-count]').forEach(runCounter);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  stats.forEach(el => obs.observe(el));
})();

/* ── Press cards bounce-in on scroll ── */
(function () {
  const grid = document.querySelector('.press-grid-animated');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.press-card'));

  /* assign per-column stagger delay so cards in the same row pop left→right */
  const cols = 4;
  cards.forEach((card, i) => {
    const col = card.classList.contains('big') ? 0 : i % cols;
    card.style.setProperty('--pc-delay', `${col * 70}ms`);
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('press-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  cards.forEach(card => obs.observe(card));
})();

/* ── 3D perspective tilt on card hover ── */
(function () {
  const cards = document.querySelectorAll('.pillar-card, .diff-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const cx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const cy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      card.style.transition = 'box-shadow 0.2s, border-color 0.2s';
      card.style.transform = `perspective(900px) rotateY(${cx * 8}deg) rotateX(${-cy * 8}deg) translateY(-10px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.65s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s, border-color 0.3s';
      card.style.transform = '';
    });
  });
})();

/* ── Hero parallax — content drifts at 0.12× scroll speed ── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const inner = document.querySelector('.hero-copy');
  if (!inner) return;
  const vh = window.innerHeight;
  let _rafId = null;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(_rafId);
    _rafId = requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < vh) inner.style.transform = `translateY(${y * 0.12}px)`;
      else inner.style.transform = '';
    });
  }, { passive: true });
})();

/* ── Google Maps ── */
function initVertusMap() {
  const el = document.getElementById('gmap');
  if (!el) return;

  const DARK_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c0c0c0' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#383838' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d3d3d' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
  ];

  const POINTS = [
    { name: 'CJA', lat: -3.752672,  lng: -38.5516281, active: true,  url: 'https://maps.app.goo.gl/RucaCwpC9zvBc5E46' },
    { name: 'Pamil', lat: -3.7408827, lng: -38.548699,  active: true,  url: 'https://maps.app.goo.gl/u45zsBXsUwPaBTW99' },
    { name: 'Cometa Barão do Rio Branco', lat: -3.7428723, lng: -38.5333842, active: true,  url: 'https://maps.app.goo.gl/eudUGrN9tiMtGzEc8' },
    { name: 'Hotel Laranjeiras', lat: -3.5603188, lng: -41.1067186, active: false, url: 'https://maps.app.goo.gl/qjYuREXHVSQjakh66' },
    { name: 'Moove Montese (3 pts)', lat: -3.7553811, lng: -38.5414821, active: false, url: 'https://maps.app.goo.gl/nm7ceDKJs2TPhrdJ9' },
    { name: 'Grupo Cyclo', lat: -3.7894335, lng: -38.5854335, active: false, url: 'https://maps.app.goo.gl/Zpxp9ocJgXZB6t4B8' },
    { name: 'Mineiro Casa de Amigos', lat: -4.2252657, lng: -38.9239553, active: false, url: 'https://maps.app.goo.gl/pKFutvWuo41MMRSHA' },
    { name: 'Condomínio Alto do Parque', lat: -3.7478898, lng: -38.4752003, active: false, url: 'https://maps.app.goo.gl/tATcZqTie4jqoVwd7' },
    { name: 'Condomínio Hortus', lat: -3.7997332, lng: -38.5698613, active: false, url: 'https://maps.app.goo.gl/wCk3rErrtyNScsBo7' },
  ];

  const map = new google.maps.Map(el, {
    zoom: 12,
    center: { lat: -3.76, lng: -38.54 },
    styles: DARK_STYLE,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    gestureHandling: 'cooperative',
  });

  const activeSvg = (label) => ({
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <defs>
          <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#FF7E27" filter="url(#g)"/>
        <circle cx="18" cy="18" r="7" fill="white"/>
        <circle cx="18" cy="18" r="3.5" fill="#FF7E27"/>
      </svg>`),
    scaledSize: new google.maps.Size(36, 44),
    anchor: new google.maps.Point(18, 44),
  });

  const futureSvg = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
        <path d="M15 1C7.28 1 1 7.28 1 15c0 11.25 14 22 14 22S29 26.25 29 15C29 7.28 22.72 1 15 1z"
              fill="none" stroke="#FF7E27" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
        <circle cx="15" cy="15" r="5" fill="none" stroke="#FF7E27" stroke-width="1.5" opacity="0.6"/>
      </svg>`),
    scaledSize: new google.maps.Size(30, 38),
    anchor: new google.maps.Point(15, 38),
  };

  const infoWindow = new google.maps.InfoWindow();
  const bounds = new google.maps.LatLngBounds();

  POINTS.forEach((p) => {
    const pos = { lat: p.lat, lng: p.lng };
    const marker = new google.maps.Marker({
      position: pos,
      map,
      icon: p.active ? activeSvg(p.name) : futureSvg,
      title: p.name,
      animation: p.active ? google.maps.Animation.DROP : null,
    });

    const status = p.active
      ? '<span style="color:#FF7E27;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em">● Operando</span>'
      : '<span style="color:rgba(255,126,39,0.6);font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em">◌ Em breve</span>';

    marker.addListener('click', () => {
      infoWindow.setContent(`
        <div style="font-family:Archivo,sans-serif;background:#1e1c1c;color:#fff;padding:12px 14px;border-radius:8px;min-width:180px;border:1px solid rgba(255,126,39,0.3);">
          <div style="margin-bottom:6px">${status}</div>
          <div style="font-size:0.92rem;font-weight:800;line-height:1.3;margin-bottom:10px">${p.name}</div>
          <a href="${p.url}" target="_blank" rel="noopener"
             style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;font-weight:700;color:#FF7E27;text-decoration:none;border:1px solid rgba(255,126,39,0.4);border-radius:5px;padding:5px 10px;">
            Ver no Google Maps ↗
          </a>
        </div>`);
      infoWindow.open(map, marker);
    });

    bounds.extend(pos);
  });

  map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
}
