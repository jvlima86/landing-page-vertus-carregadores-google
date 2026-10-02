/* Vertus Mob — simulador de investimento em eletroposto (vertus-mob.com/simulador)
   Questionário em etapas → lead (CRM + planilha) → resultado na hora, com ajuste ao vivo.
   O cálculo é o da apresentação comercial: catalog.js + dre.js (espelhos, ver cabeçalho deles). */
(function () {
  'use strict';

  const CONFIG = {
    crmBase: 'https://crm-vertus.vercel.app',
    sheetUrl: 'https://script.google.com/macros/s/AKfycbwYLt1SL4Vry6mhzIhLUWZKWpDiwmRkI_wosoPBaGGjJn3DLe6AuBmbCeDkWeib42iW/exec',
    waNumber: '5585984313152',
    waDisplay: '(85) 98431-3152',
    adsConversion: 'AW-17006818606',
    timeoutMs: 6000,
    produto: 'Simulador de eletroposto',
  };

  const { PREMISES, USINAS, ELETROPOSTOS, getEletroposto, getUsina } = window.VertusCatalog;
  const DRE = window.VertusDRE;

  // Foto por gabinete (mesma regra da apresentação: 30/40 kW parede 1 bico · 60/80 kW parede 2 bicos · 120 kW totem)
  const FOTO = { ep30: '/assets/charger-30kw.webp', ep40: '/assets/charger-30kw.webp', ep60: '/assets/charger-60kw.webp', ep80: '/assets/charger-60kw.webp', ep120: '/assets/charger-120kw.webp' };
  const TIER = { ep30: 'Compacto', ep40: 'Compacto', ep60: 'Intermediário', ep80: 'Intermediário', ep120: 'Alta potência' };
  const QTDS = [1, 2];
  const USINA_OPCOES = [null].concat(USINAS.map((u) => u.id));

  const body = document.body;
  const params = new URLSearchParams(window.location.search);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.js-wa-display').forEach((el) => { el.textContent = CONFIG.waDisplay; });

  /* ════════ Formatação ════════ */
  const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const num1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const money = (v) => brl0.format(Math.round(v)).replace(/ /g, ' ');
  const money2 = (v) => brl2.format(v).replace(/ /g, ' ');
  function anosMeses(m) {
    const a = Math.floor(m / 12), r = m % 12;
    const pa = a ? a + (a > 1 ? ' anos' : ' ano') : '';
    const pm = r ? r + (r > 1 ? ' meses' : ' mês') : '';
    return [pa, pm].filter(Boolean).join(' e ');
  }
  function descConfig(s) {
    const ep = getEletroposto(s.ep);
    return (s.qtd > 1 ? s.qtd + ' carregadores de ' : '1 carregador de ') + ep.potencia + ' kW' + (s.usina ? ' + usina solar ' + getUsina(s.usina).porte : '');
  }

  /* ════════ Cálculo ════════ */
  function simular(s) {
    const eps = Array(s.qtd).fill(s.ep);
    return s.usina
      ? DRE.calcularUsinaComEPs([s.usina], eps, true, s.aluguel)   // com usina: inclui a obra civil
      : DRE.calcularEletropostoSolo(eps, s.aluguel);
  }
  // Usina cuja geração mais se aproxima do consumo dos carregadores
  function usinaIndicada(s) {
    const consumo = getEletroposto(s.ep).consumoMensal * s.qtd;
    return USINAS.reduce((best, u) => (Math.abs(u.geracaoMensal - consumo) < Math.abs(best.geracaoMensal - consumo) ? u : best)).id;
  }
  // Recomendação: maior resultado mensal dentro do teto de investimento
  function recomendar(teto, querUsina, aluguel) {
    const cands = [];
    const usinas = querUsina === 'nao' ? [null] : querUsina === 'sim' ? USINAS.map((u) => u.id) : USINA_OPCOES;
    ELETROPOSTOS.forEach((ep) => QTDS.forEach((qtd) => usinas.forEach((usina) => {
      const s = { ep: ep.id, qtd, usina, aluguel };
      const r = simular(s);
      if (r.investimento <= teto && r.lucroMensal > 0) cands.push({ s, r });
    })));
    cands.sort((a, b) => b.r.lucroMensal - a.r.lucroMensal);
    if (cands.length) return { s: cands[0].s, nota: '' };
    // Usina não coube no teto: mostra o melhor eletroposto sozinho e avisa
    const solo = recomendar(teto, 'nao', aluguel);
    let minUsina = Infinity;
    ELETROPOSTOS.forEach((ep) => USINAS.forEach((u) => { minUsina = Math.min(minUsina, simular({ ep: ep.id, qtd: 1, usina: u.id, aluguel }).investimento); }));
    return { s: solo.s, nota: 'Com usina solar, o investimento começa em ' + money(minUsina) + '. Mostramos o eletroposto sozinho; ajuste abaixo para ver com usina.' };
  }

  /* ════════ Questionário em etapas ════════ */
  const form = document.getElementById('simForm');
  const card = document.getElementById('simulacao');
  const steps = Array.from(form.querySelectorAll('.qf-step'));
  const progress = form.querySelector('.qf-progress');
  const progressLabel = form.querySelector('.qf-progress-label');
  let current = 0, started = false, submitting = false;

  progress.innerHTML = steps.slice(0, -1).map(() => '<span></span>').join('');
  function render() {
    steps.forEach((s, i) => s.classList.toggle('active', i === current));
    Array.from(progress.children).forEach((c, i) => c.classList.toggle('done', i <= current));
    progressLabel.textContent = current < steps.length - 1 ? 'Pergunta ' + (current + 1) + ' de ' + (steps.length - 1) : 'Último passo · seus dados';
    const q = steps[current].querySelector('.qf-q');
    if (q && started) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
    const first = steps[current].querySelector('input:not([type="radio"])');
    if (first && started && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  }
  function go(i) {
    started = true;
    current = Math.max(0, Math.min(steps.length - 1, i));
    render();
    if (current > 0) card.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'sim_step', step: current + 1 });
  }
  form.querySelectorAll('.qf-opt input[type="radio"]').forEach((r) => r.addEventListener('change', () => clearStepError(r.closest('.qf-step'))));
  form.querySelectorAll('.qf-opt label').forEach((l) => l.addEventListener('click', () => {
    const r = document.getElementById(l.htmlFor);
    const stepEl = l.closest('.qf-step');
    setTimeout(() => { if (r && r.checked && steps.indexOf(stepEl) === current) go(current + 1); }, 200);
  }));
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('input[enterkeyhint="next"]')) return;
    e.preventDefault();
    const f = Array.from(steps[current].querySelectorAll('input:not([tabindex="-1"])'));
    const n = f[f.indexOf(e.target) + 1];
    if (n) n.focus(); else form.requestSubmit();
  });
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
  form.querySelectorAll('input[data-phone]').forEach((inp) => inp.addEventListener('input', () => { inp.value = maskPhone(inp.value); clearError(inp); }));
  form.querySelectorAll('input[type="text"], input[type="tel"]').forEach((f) => f.addEventListener('input', () => clearError(f)));
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
      if (form.querySelector('input[name="' + radios[0].name + '"]:checked')) return true;
      const p = document.createElement('p'); p.className = 'field-error qf-step-error'; p.setAttribute('role', 'alert'); p.textContent = 'Escolha uma opção para continuar.';
      stepEl.querySelector('.qf-opts').after(p);
      return false;
    }
    let firstBad = null;
    stepEl.querySelectorAll('input[required]').forEach((f) => {
      const v = f.value.trim();
      const bad = !v || (f.dataset.phone !== undefined && !phoneValid(v));
      if (bad) {
        setError(f, f.dataset.phone !== undefined ? 'Informe um WhatsApp válido com DDD.' : f.name === 'nome' ? 'Informe seu nome.' : 'Preencha este campo.');
        if (!firstBad) firstBad = f;
      }
    });
    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ── Envio do lead ── */
  function withTimeout(ms) {
    if ('AbortSignal' in window && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal;
  }
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((k) => { const v = params.get(k); if (v) utm[k] = v; });
  function checked(name) { return form.querySelector('input[name="' + name + '"]:checked'); }
  function collect() {
    const answers = {};
    steps.forEach((s) => { const r = s.querySelector('input[type="radio"]:checked'); if (r) answers[s.dataset.label] = r.value; });
    const g = (n) => form.querySelector('[name="' + n + '"]').value.trim();
    return { answers, nome: g('nome'), whatsapp: g('whatsapp'), cidade: g('cidade') };
  }
  function resumoSimulacao(s, r) {
    return descConfig(s) + ' · ' + (s.aluguel ? 'local alugado' : 'local próprio') + ' · investimento ' + money(r.investimento) +
      ' · resultado ' + money(r.lucroMensal) + '/mês · retorno ~' + Math.round(r.paybackMeses) + ' meses';
  }
  async function postSheet(data) {
    try { await fetch(CONFIG.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data), signal: withTimeout(CONFIG.timeoutMs) }); } catch (_) {}
  }
  async function postCRM(d, s, r) {
    try {
      const fields = Object.assign({}, d.answers, {
        'Cidade': d.cidade,
        'Simulação': resumoSimulacao(s, r),
        'Investimento simulado (R$)': String(Math.round(r.investimento)),
        'Produto': CONFIG.produto,
        'Origem': 'Simulador vertus-mob.com',
      });
      await fetch(CONFIG.crmBase + '/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, signal: withTimeout(CONFIG.timeoutMs),
        body: JSON.stringify(Object.assign({
          phone: d.whatsapp, name: d.nome || undefined, sourceName: 'Site · Simulador de eletroposto', fields,
          referrer: document.referrer || undefined, landing_page: window.location.href,
        }, utm)),
      });
    } catch (_) {}
  }
  // Conversões: uma vez por sessão (Google Ads; OpenAI Ads se o pixel estiver instalado)
  function marcarConversao() {
    try { if (sessionStorage.getItem('vertusSimConv')) return; sessionStorage.setItem('vertusSimConv', '1'); } catch (_) {}
    if (typeof window.gtag === 'function') window.gtag('event', 'conversion', { send_to: CONFIG.adsConversion });
    if (typeof window.oaiq === 'function') window.oaiq('measure', 'lead_created', { type: 'customer_action' });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_simulador' });
  }

  let lead = null;  // { nome, ... } — usado na mensagem do WhatsApp
  let state = null; // { ep, qtd, usina, aluguel }
  let teto = Infinity; // faixa de investimento informada

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (current < steps.length - 1) { if (validateStep(steps[current])) go(current + 1); return; }
    if (!validateStep(steps[current])) return;
    submitting = true;
    const btn = form.querySelector('.qf-submit');
    btn.dataset.originalHtml = btn.innerHTML; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Calculando…';

    const d = collect();
    teto = Number(checked('investimento').dataset.teto);
    const aluguel = checked('local').dataset.aluguel === '1';
    const querUsina = checked('usina').dataset.usina;
    const rec = recomendar(teto, querUsina, aluguel);
    state = rec.s;
    lead = d;
    const r = simular(state);

    const hp = form.querySelector('input[name="site"]');
    const suspicious = (hp && hp.value) || performance.now() < 2000;
    if (!suspicious) {
      const flat = Object.assign({
        nome: d.nome, whatsapp: d.whatsapp, cidade: d.cidade,
        interesse: CONFIG.produto, profissao: d.answers['Tipo de local'] || '', pretencao: d.answers['Pretensão de investimento'] || '',
        origem: 'simulador', simulacao: resumoSimulacao(state, r), orcamento: String(Math.round(r.investimento)),
        pagina: window.location.href, data: new Date().toISOString(),
      }, d.answers, utm);
      // Mostra o resultado sem esperar a rede além de 1,5 s
      await Promise.race([Promise.allSettled([postCRM(d, state, r), postSheet(flat)]), new Promise((ok) => setTimeout(ok, 1500))]);
      marcarConversao();
    }
    showResult(rec.nota);
    submitting = false;
    btn.innerHTML = btn.dataset.originalHtml; btn.removeAttribute('aria-busy');
  });

  /* ════════ Resultado ════════ */
  const res = document.getElementById('resultado');
  const $ = (sel) => res.querySelector(sel);

  function chip(group, value, label, active) {
    return '<button type="button" role="radio" class="sim-chip" data-group="' + group + '" data-value="' + value + '" aria-checked="' + active + '" tabindex="' + (active ? 0 : -1) + '">' + label + '</button>';
  }
  function renderChips() {
    $('[data-ctl="ep"]').innerHTML = ELETROPOSTOS.map((e) => chip('ep', e.id, String(e.potencia), e.id === state.ep)).join('');
    $('[data-ctl="qtd"]').innerHTML = QTDS.map((q) => chip('qtd', q, String(q), q === state.qtd)).join('');
    $('[data-ctl="usina"]').innerHTML = USINA_OPCOES.map((u) => chip('usina', u || '', u ? getUsina(u).porte : 'Sem usina', u === state.usina)).join('');
    $('[data-ctl="aluguel"]').innerHTML = chip('aluguel', '0', 'Local próprio', !state.aluguel) + chip('aluguel', '1', 'Alugado', state.aluguel);
  }

  function dreRows(r) {
    const c = r.custos, rows = [];
    const add = (label, v, cls) => { if (Math.abs(v) >= 0.5) rows.push('<tr class="' + (cls || '') + '"><th scope="row">' + label + '</th><td>' + (v < 0 ? '− ' : '') + money(Math.abs(v)) + '</td></tr>'); };
    add('Receita de recarga <small>' + num0.format(r.energia.paraEPs) + ' kWh × ' + money2(r.precoRecarga) + '</small>', r.receita.recarga);
    add('Assinatura de créditos da usina (excedente) <small>' + num0.format(r.energia.paraGD) + ' kWh</small>', r.receita.liquidaGD);
    add('Energia comprada', -c.energiaSolure);
    add('Energia da usina', -c.energiaPropria);
    add('Plataforma de recarga', -c.plataforma);
    add('Gestão Vertus (opcional)', -c.admVertus);
    add('Aluguel da vaga', -c.aluguel);
    add('Manutenção da usina', -c.om);
    add('Taxa de disponibilidade', -c.disponibilidade);
    add('Impostos', -c.impostos);
    rows.push('<tr class="is-total"><th scope="row">Resultado líquido estimado</th><td>' + money(r.lucroMensal) + '</td></tr>');
    return rows.join('');
  }
  function premissas(s) {
    const ep = getEletroposto(s.ep);
    const horas = ep.consumoMensal / (ep.potencia * 30);
    const P = PREMISES;
    const li = [
      'Preço médio da recarga: ' + money2(P.precoRecarga) + '/kWh (média entre motoristas de aplicativo, frotas e usuários comuns).',
      'Energia vendida: ' + num0.format(ep.consumoMensal) + ' kWh por mês em cada carregador de ' + ep.potencia + ' kW, o equivalente a ' + num1.format(horas) + ' h por dia na potência máxima.',
      'Energia comprada: ' + money2(P.custoEnergiaSolure) + '/kWh' + (s.usina ? '; energia compensada pela usina: ' + money2(P.custoEnergiaPropria) + '/kWh.' : '.'),
      'Plataforma de recarga: ' + money(P.plataformaFixa) + ' por carregador/mês + ' + Math.round(P.plataformaVariavel * 100) + '% da receita de recarga.',
      'Gestão Vertus (opcional): ' + Math.round(P.admVertusEPSolo * 100) + '% da receita de recarga. O resultado considera a gestão; sem ela, você assume a operação.',
      'Aluguel da vaga: ' + money(P.aluguelVaga) + ' por vaga/mês, só quando o local não é seu.',
      'Impostos: ' + num1.format(P.impostos * 100) + '%.',
    ];
    if (s.usina) li.push('Usina: créditos excedentes compensados por assinantes (geração compartilhada) a ' + money2(P.tarifaVenda) + '/kWh, com ' + Math.round(P.descontoGD * 100) + '% de desconto; manutenção de ' + Math.round(P.omAnual * 100) + '% ao ano; taxa de disponibilidade de ' + money(P.disponibilidade) + '/mês; investimento com obra civil.');
    li.push('Valores sem financiamento e sem reajuste de tarifas ao longo do tempo.');
    return li.map((t) => '<li>' + t + '</li>').join('');
  }
  function compareBox(s, r) {
    const other = s.usina ? Object.assign({}, s, { usina: null }) : Object.assign({}, s, { usina: usinaIndicada(s) });
    const ro = simular(other);
    const col = (st, rr, atual) => '<button type="button" class="sim-cmp' + (atual ? ' is-current' : '') + '" data-apply=\'' + JSON.stringify(st) + '\'' + (atual ? ' aria-current="true"' : '') + '>' +
      '<span class="sim-cmp-tag">' + (st.usina ? 'Com usina <span class="nu">' + getUsina(st.usina).porte + '</span>' : 'Só o eletroposto') + '</span>' + (rr.investimento > teto ? '<span class="sim-cmp-over">Acima da faixa que você informou</span>' : '') +
      '<span class="sim-cmp-row"><span>Investimento</span><strong>' + money(rr.investimento) + '</strong></span>' +
      '<span class="sim-cmp-row"><span>Resultado estimado/mês</span><strong>' + money(rr.lucroMensal) + '</strong></span>' +
      '<span class="sim-cmp-row"><span>Retorno estimado</span><strong>' + Math.round(rr.paybackMeses) + ' meses</strong></span></button>';
    const a = s.usina ? [other, ro, false, s, r, true] : [s, r, true, other, ro, false];
    return '<h3>Com ou sem usina solar</h3><div class="sim-cmp-grid">' + col(a[0], a[1], a[2]) + col(a[3], a[4], a[5]) + '</div>' +
      '<p class="sim-cmp-note">Nesta simulação, a usina aumenta o investimento e o resultado mensal estimado: ela compensa a energia do carregador e o excedente gera créditos de energia.</p>';
  }
  function cells(payback) {
    let h = '';
    for (let i = 0; i < 10; i++) h += '<span class="' + ((i * 6 + 3) < payback ? 'c-rec' : 'c-luc') + '"></span>';
    return h;
  }
  function waHref(s, r) {
    const nome = lead && lead.nome ? lead.nome.trim().split(' ')[0] : '';
    const msg = 'Olá! ' + (nome ? 'Sou ' + nome + '. ' : '') + 'Fiz a simulação no site da Vertus Mob: ' + descConfig(s) + ', investimento de ' + money(r.investimento) + '. Quero avaliar o meu ponto.';
    return 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(msg);
  }

  function update() {
    const s = state, r = simular(s), ep = getEletroposto(s.ep);
    $('[data-res-foto]').src = FOTO[s.ep];
    $('[data-res-foto]').alt = 'Carregador NeoCharge de ' + ep.potencia + ' kW';
    $('[data-res-tier]').innerHTML = TIER[s.ep] + ' · <span class="nu">' + ep.potencia + ' kW</span>';
    $('[data-res-config]').textContent = descConfig(s);
    $('[data-res-config-sub]').textContent = r.vagasTotal + (r.vagasTotal > 1 ? ' vagas de recarga' : ' vaga de recarga') + ' · ' + (s.aluguel ? 'local alugado' : 'local próprio');
    $('[data-res-invest]').textContent = money(r.investimento);
    const parc = DRE.parcelamentoEP(r.capexEPs);
    $('[data-res-parcela]').textContent = (s.usina ? 'Carregador' + (s.qtd > 1 ? 'es' : '') + ' em até ' : 'Em até ') + parc.parcelas + '× de ' + money(parc.valorParcela) + ' ' + parc.condicao;
    $('[data-res-fat]').textContent = money(r.receita.recarga + r.receita.liquidaGD);
    $('[data-res-lucro]').textContent = money(r.lucroMensal);
    const pb = Math.round(r.paybackMeses);
    $('[data-res-payback]').textContent = pb + ' meses';
    $('[data-res-payback-sub]').textContent = 'cerca de ' + anosMeses(pb) + (pb > 60 ? ' (além do horizonte do gráfico)' : '');
    $('[data-res-cells]').innerHTML = cells(r.paybackMeses);
    $('[data-res-dre]').innerHTML = dreRows(r);
    $('[data-res-premissas]').innerHTML = premissas(s);
    $('[data-res-compare]').innerHTML = compareBox(s, r);
    $('[data-res-wa]').href = waHref(s, r);
    renderChips();
  }

  function showResult(nota) {
    const nome = lead && lead.nome ? lead.nome.trim().split(' ')[0] : '';
    $('[data-res-nome]').textContent = nome ? nome + ', ' : '';
    const n = $('[data-res-nota]'); n.textContent = nota || ''; n.hidden = !nota;
    update();
    body.classList.add('has-result');
    res.hidden = false;
    res.scrollIntoView({ behavior: 'auto', block: 'start' });
    $('#res-title').focus({ preventScroll: true });
  }

  res.addEventListener('click', (e) => {
    const c = e.target.closest('.sim-chip');
    const cmp = e.target.closest('[data-apply]');
    if (c) {
      const g = c.dataset.group, v = c.dataset.value;
      if (g === 'ep') state.ep = v;
      if (g === 'qtd') state.qtd = Number(v);
      if (g === 'usina') state.usina = v || null;
      if (g === 'aluguel') state.aluguel = v === '1';
      update();
      const again = res.querySelector('.sim-chip[data-group="' + g + '"][data-value="' + v + '"]');
      if (again) again.focus({ preventScroll: true });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'sim_ajuste', campo: g, valor: v });
    } else if (cmp && !cmp.classList.contains('is-current')) {
      state = JSON.parse(cmp.dataset.apply);
      update();
      const cur = res.querySelector('.sim-cmp.is-current');
      if (cur) cur.focus({ preventScroll: true });
    }
  });
  // Setas do teclado dentro de cada grupo de chips (padrão radiogroup)
  res.addEventListener('keydown', (e) => {
    const c = e.target.closest('.sim-chip');
    if (!c || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const sib = Array.from(c.parentNode.children);
    const i = sib.indexOf(c) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
    const n = sib[(i + sib.length) % sib.length];
    n.click();
  });
  res.querySelector('[data-res-refazer]').addEventListener('click', () => {
    body.classList.remove('has-result');
    res.hidden = true;
    go(0);
    card.scrollIntoView({ behavior: 'auto', block: 'start' });
  });

  /* ── CTA fixo some enquanto o formulário está na tela ── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((en) => { body.classList.toggle('form-in-view', en.some((x) => x.isIntersecting)); }, { threshold: 0.25 });
    obs.observe(card);
  }
  document.querySelectorAll('[data-scroll-form]').forEach((a) => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (body.classList.contains('has-result')) { res.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
    card.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }));

  render();
})();
