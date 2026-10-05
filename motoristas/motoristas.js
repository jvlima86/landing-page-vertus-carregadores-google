/* Vertus Mob — área do motorista (vertus-mob.com/motoristas)
   Mapa dos eletropostos abertos ao público, rota no Google Maps e pedido do cupom de motorista de app. */
(function () {
  'use strict';

  /* ══════════════ CONFIGURAÇÃO ══════════════ */
  // WhatsApp do bot do CRM que valida o print e libera o cupom (a palavra "cupom" na mensagem dispara o fluxo).
  const WA_NUMBER = '5585996163937';
  const WA_DISPLAY = '(85) 99616-3937';
  const WA_COUPON_MSG = 'Olá! Sou motorista de aplicativo e quero o cupom de desconto da Vertus Mob. Vou enviar o print do meu perfil.';
  const MAPS_KEY = 'AIzaSyDzn3uYW2NljaXXjcAV39Ad_yPwr9q1QXs';

  // Eletropostos abertos ao público (condomínios ficam de fora: são de uso dos moradores).
  // lat/lng null = sem coordenada confirmada: aparece na lista e a rota usa o endereço.
  const ESTACOES = [
    { id: 'cometa', nome: 'Cometa Barão do Rio Branco', endereco: 'R. Barão do Rio Branco, 2841 · Fátima', cidade: 'Fortaleza', lat: -3.7428723, lng: -38.5333842, potencia: '60 kW · 2 conectores', conector: 'CCS2', app: 'Tupi' },
    { id: 'lauro-maia', nome: 'Posto Lauro Maia', endereco: 'R. Lauro Maia, 700 · Fátima', cidade: 'Fortaleza', lat: -3.7466703, lng: -38.5232352, potencia: '60 kW · 2 conectores', conector: 'CCS2', app: 'V Recargas', preco: 'R$ 1,49/kWh' },
    { id: 'pamil', nome: 'Pamil Parque Araxá', endereco: 'R. Padre Cícero, 750 · Rodolfo Teófilo', cidade: 'Fortaleza', lat: -3.7408827, lng: -38.548699, potencia: '22 kW', conector: 'Tipo 2 (AC)', app: 'Tupi' },
    { id: 'vila-peri', nome: 'Eletroposto Vila Peri', endereco: 'R. Eça de Queirós, 803 · Vila Peri', cidade: 'Fortaleza', lat: -3.7894335, lng: -38.5854335, potencia: '30 kW', conector: 'CCS2', app: 'Tupi' },
    { id: 'arena-celio-santos', nome: 'Arena Célio Santos', endereco: 'São Benedito', cidade: 'Ceará', lat: null, lng: null, rota: 'Arena Célio Santos, São Benedito - CE' },
  ];
  /* ══════════════════════════════════════════ */

  const listEl = document.querySelector('[data-list]');
  const mapEl = document.getElementById('mtmap');
  const mapMsg = document.querySelector('[data-map-msg]');
  const nearBtn = document.querySelector('[data-near]');
  const nearStatus = document.querySelector('[data-near-status]');
  let map = null, info = null, userMarker = null;
  const markers = {};
  let userPos = null;

  /* ── WhatsApp do cupom ── */
  const waHref = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(WA_COUPON_MSG);
  document.querySelectorAll('[data-wa-coupon]').forEach((a) => {
    a.href = waHref;
    a.addEventListener('click', () => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'cupom_motorista_click' }); });
  });
  document.querySelectorAll('[data-wa-display]').forEach((el) => { el.textContent = WA_DISPLAY; });

  /* ── Utilidades ── */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function rotaUrl(e) {
    const dest = e.lat != null ? e.lat + ',' + e.lng : (e.rota || e.nome + ', ' + e.cidade);
    return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + encodeURIComponent(dest);
  }
  function distKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const fmtKm = (km) => (km < 1 ? Math.round(km * 1000) + ' m' : km.toLocaleString('pt-BR', { maximumFractionDigits: km < 10 ? 1 : 0 }) + ' km');
  const pin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const route = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';

  /* ── Lista ── */
  function renderList() {
    const items = ESTACOES.map((e) => Object.assign({}, e, { km: userPos && e.lat != null ? distKm(userPos, e) : null }));
    if (userPos) items.sort((a, b) => (a.km == null) - (b.km == null) || (a.km || 0) - (b.km || 0));
    listEl.innerHTML = items.map((e, i) => {
      const specs = [e.potencia, e.conector].filter(Boolean).map(esc).join(' · ');
      const meta = [
        e.app ? '<li><span>App</span>' + esc(e.app) + '</li>' : '',
        e.app ? '<li><span>Preço</span>' + esc(e.preco || 'no app') + '</li>' : '',
      ].join('');
      return '<li class="mt-item" id="est-' + e.id + '" data-id="' + e.id + '">' +
        '<div class="mt-item-top"><span class="mt-item-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        (e.km != null ? '<span class="mt-km">' + fmtKm(e.km) + '</span>' : '') + '</div>' +
        '<h3>' + esc(e.nome) + '</h3>' +
        '<p class="mt-addr">' + esc(e.endereco) + (e.cidade && e.endereco !== e.cidade ? ' · ' + esc(e.cidade) : '') + '</p>' +
        (specs ? '<p class="mt-specs">' + specs + '</p>' : '<p class="mt-specs is-muted">Potência e conector: confirme pelo WhatsApp</p>') +
        (meta ? '<ul class="mt-meta">' + meta + '</ul>' : '') +
        '<div class="mt-actions">' +
        '<a class="mt-go" href="' + rotaUrl(e) + '" target="_blank" rel="noopener" data-go="' + e.id + '">' + route + 'Como chegar</a>' +
        (e.lat != null ? '<button type="button" class="mt-show" data-show="' + e.id + '">' + pin + '<span>Ver no mapa</span></button>' : '') +
        '</div></li>';
    }).join('');
  }

  listEl.addEventListener('click', (ev) => {
    const go = ev.target.closest('[data-go]');
    if (go) { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'como_chegar_click', estacao: go.dataset.go }); return; }
    const show = ev.target.closest('[data-show]');
    if (!show) return;
    const id = show.dataset.show;
    if (map && markers[id]) {
      map.panTo(markers[id].getPosition());
      if (map.getZoom() < 15) map.setZoom(15);
      openInfo(id);
    }
    mapEl.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });

  /* ── Mais perto de mim ── */
  nearBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) { nearStatus.textContent = 'Seu navegador não informa a localização. Use o mapa ou a lista.'; return; }
    nearBtn.setAttribute('aria-busy', 'true');
    nearStatus.textContent = 'Procurando sua localização…';
    navigator.geolocation.getCurrentPosition((p) => {
      nearBtn.removeAttribute('aria-busy');
      userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
      renderList();
      const first = ESTACOES.filter((e) => e.lat != null).map((e) => ({ e, km: distKm(userPos, e) })).sort((a, b) => a.km - b.km)[0];
      nearStatus.textContent = first ? 'Mais perto: ' + first.e.nome + ', a ' + fmtKm(first.km) + ' em linha reta. Lista ordenada pela distância.' : '';
      if (map) {
        const pos = new google.maps.LatLng(userPos.lat, userPos.lng);
        if (!userMarker) {
          userMarker = new google.maps.Marker({ map, position: pos, title: 'Você está aqui', zIndex: 5,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#F1F1F1', fillOpacity: 1, strokeColor: '#1E1C1C', strokeWeight: 3 } });
        } else userMarker.setPosition(pos);
        if (first) {
          const b = new google.maps.LatLngBounds(); b.extend(pos); b.extend(markers[first.e.id].getPosition());
          map.fitBounds(b, 60);
          google.maps.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 15) map.setZoom(15); });
        }
      }
    }, (err) => {
      nearBtn.removeAttribute('aria-busy');
      nearStatus.textContent = err.code === 1
        ? 'Sem permissão de localização. Libere nas configurações do navegador ou use o mapa.'
        : 'Não foi possível obter sua localização agora. Use o mapa ou a lista.';
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  /* ── Mapa (Google Maps JS) ── */
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
  function openInfo(id) {
    const e = ESTACOES.find((x) => x.id === id);
    info.setContent(
      '<div class="mt-info"><strong>' + esc(e.nome) + '</strong><span>' + esc(e.endereco) + '</span>' +
      (e.potencia ? '<span>' + esc(e.potencia + (e.conector ? ' · ' + e.conector : '')) + '</span>' : '') +
      '<a href="' + rotaUrl(e) + '" target="_blank" rel="noopener">Como chegar ↗</a></div>');
    info.open({ anchor: markers[id], map, shouldFocus: false });
    document.querySelectorAll('.mt-item').forEach((li) => li.classList.toggle('is-active', li.dataset.id === id));
  }
  window.initMotoristasMap = function () {
    if (!window.google || !google.maps) return mapFailed();
    mapMsg.remove();
    const small = window.matchMedia('(max-width: 720px)').matches;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    map = new google.maps.Map(mapEl, {
      zoom: 13, center: { lat: -3.755, lng: -38.545 }, styles: DARK_STYLE, disableDefaultUI: true,
      zoomControl: true, zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      gestureHandling: touch ? 'cooperative' : 'greedy', backgroundColor: '#1a1a1a', clickableIcons: false,
    });
    info = new google.maps.InfoWindow();
    const icon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">' +
        '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#FF7E27"/>' +
        '<circle cx="18" cy="18" r="7" fill="#F1F1F1"/><circle cx="18" cy="18" r="3.5" fill="#FF7E27"/></svg>'),
      scaledSize: new google.maps.Size(36, 44), anchor: new google.maps.Point(18, 44),
    };
    const bounds = new google.maps.LatLngBounds();
    ESTACOES.filter((e) => e.lat != null).forEach((e) => {
      const m = new google.maps.Marker({ map, position: { lat: e.lat, lng: e.lng }, icon, title: e.nome });
      m.addListener('click', () => openInfo(e.id));
      markers[e.id] = m;
      bounds.extend(m.getPosition());
    });
    map.fitBounds(bounds, small ? 48 : 72);
    google.maps.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 14) map.setZoom(14); });
  };
  function mapFailed() {
    mapEl.classList.add('is-failed');
    if (mapMsg && mapMsg.isConnected) mapMsg.textContent = 'O mapa não carregou. Use a lista: o botão "Como chegar" abre a rota no Google Maps.';
  }
  function loadMap() {
    window.gm_authFailure = mapFailed;
    const s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + MAPS_KEY + '&callback=initMotoristasMap&loading=async';
    s.async = true; s.onerror = mapFailed;
    document.head.appendChild(s);
  }

  /* ── CTA fixo some enquanto o bloco do cupom está na tela ── */
  const coupon = document.getElementById('cupom');
  if (coupon && 'IntersectionObserver' in window) {
    new IntersectionObserver((en) => document.body.classList.toggle('coupon-in-view', en.some((x) => x.isIntersecting)), { threshold: 0.2 }).observe(coupon);
    // e só aparece depois que o topo sai da tela (não compete com os botões do topo)
    const hero = document.querySelector('.mt-hero');
    if (hero) new IntersectionObserver((en) => document.body.classList.toggle('hero-in-view', en.some((x) => x.isIntersecting)), { threshold: 0 }).observe(hero);
  }

  renderList();
  loadMap();
})();
