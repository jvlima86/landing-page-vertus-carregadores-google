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

  // Compare bars animate-in
  const bars = document.getElementById('compareBars');
  if (bars) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          bars.classList.add('visible');
          obs.unobserve(bars);
        }
      });
    }, { threshold: 0.25 });
    obs.observe(bars);
  }

  // Multiplier arrow grid
  const multGrid = document.querySelector('.mult-grid');
  if (multGrid) {
    const o = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.4 });
    o.observe(multGrid);
  }

  // Navbar scrolled effect
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top, behavior: 'smooth' });
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

  // Lead form submit (mock)
  const form = document.getElementById('leadForm');
  const success = document.getElementById('leadSuccess');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      success.classList.add('show');
    });
  }
})();
