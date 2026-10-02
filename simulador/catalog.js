/* ESPELHO de apresentacao-comercial-eletroposto-usina-1/catalog.js (commit 0f66196) — NÃO EDITAR AQUI.
   A fonte única de premissas e do motor é a apresentação comercial; para atualizar:
   git -C ~/Programas/apresentacao-comercial-eletroposto-usina-1 show HEAD:catalog.js > simulador/catalog.js (e recolocar este cabeçalho). */
/* Vertus — Catálogo de produtos e premissas
 * Fonte única de verdade. Toda alteração de tarifa, custo ou produto vive aqui.
 * Espelha o documento Conhecimento_Dre_eletroposto+usinas.txt
 */

const PREMISES = Object.freeze({
  tarifaVenda: 0.66,          // R$/kWh venda ao cliente final
  descontoGD: 0.30,           // 30% desconto repassado ao assinante GD
  omAnual: 0.01,              // 1% a.a. sobre capex da usina
  impostos: 0.055,            // 5,5% sobre receita líquida
  disponibilidade: 120.00,    // R$/mês fixo (fio B)

  // Eletroposto
  precoRecarga: 1.39,         // R$/kWh — média ponderada Uber/frota + usuário comum
  custoEnergiaPropria: 0.30,  // R$/kWh — energia vinda da própria usina
  custoEnergiaSolure: 0.80,   // R$/kWh — complementar quando geração < demanda
  plataformaFixa: 120.00,     // R$/mês por ponto
  plataformaVariavel: 0.10,   // 10% sobre receita de recarga
  aluguelVaga: 500.00,        // R$/mês por ponto

  // ADM Vertus (taxa de administração sobre receita bruta de recarga)
  admVertusEPSolo: 0.09,      // 9% — somente eletroposto
  admVertusCombo: 0.09,       // 9% — usina + eletroposto

  // Bundle 2× EP 30 kW
  bundle2xEp30: 116000,       // 2 × R$ 58.000 (sem desconto especial de bundle)

  // Parcelamento (somente eletroposto) — 10x sem juros no cartão.
  // `parcelamentoEPMeio` é o sufixo exibido ao lado da parcela (site, PPTX, conhecimento).
  parcelasEP: 10,
  jurosParcelamentoEP: 0,
  parcelamentoEPMeio: 'no cartão',
});

const USINAS = Object.freeze([
  {
    id: 'u30',
    porte: '30 kWp',
    potencia: 30,
    capexBase: 83000,
    obraCivil: 13000,
    geracaoMensal: 3750,  // kWh/mês
  },
  {
    id: 'u60',
    porte: '60 kWp',
    potencia: 60,
    capexBase: 155000,
    obraCivil: 18000,
    geracaoMensal: 7320,
  },
  {
    id: 'u90',
    porte: '90 kWp',
    potencia: 90,
    capexBase: 230000,
    obraCivil: 22000,
    geracaoMensal: 11000,
  },
]);

// Fotos dos eletropostos: renders em fundo branco em assets/eletropostos/ (JPG 1000px,
// gerados a partir de "imagens carregadores/" 4K — originais ficam fora do commit).
// Mesmo gabinete → mesma foto: wallbox-pedestal = 30/40 kW (1 bico) ·
// dc-holster = 60/80 kW (2 bicos) · dc-duplo = 120 kW (2 bicos).
const FOTO_EP = Object.freeze({
  wallboxPedestal: 'assets/eletropostos/wallbox-pedestal.jpg',
  dcHolster: 'assets/eletropostos/dc-holster.jpg',
  dcDuplo: 'assets/eletropostos/dc-duplo.jpg',
});

const ELETROPOSTOS = Object.freeze([
  {
    id: 'ep30',
    potencia: 30,
    tipo: '30 kW DC',
    capex: 58000,
    consumoMensal: 7200,  // 30 kW × 10h/dia × 80% × 30 dias
    vagas: 1,
    foto: FOTO_EP.wallboxPedestal,
  },
  {
    id: 'ep40',
    potencia: 40,
    tipo: '40 kW DC',
    capex: 78000,
    consumoMensal: 7680,  // 40 kW × 8h/dia × 80% × 30 dias
    vagas: 1,
    foto: FOTO_EP.wallboxPedestal,
  },
  {
    id: 'ep60',
    potencia: 60,
    tipo: '60 kW DC',
    capex: 96000,
    consumoMensal: 11520,  // 60 kW × 8h/dia × 80% × 30 dias
    vagas: 2,  // dois bicos = 2 vagas
    foto: FOTO_EP.dcHolster,
  },
  {
    id: 'ep80',
    potencia: 80,
    tipo: '80 kW DC',
    capex: 112000,
    consumoMensal: 15360,  // 80 kW × 8h/dia × 80% × 30 dias
    vagas: 2,  // dois bicos = 2 vagas
    foto: FOTO_EP.dcHolster,
  },
  {
    id: 'ep120',
    potencia: 120,
    tipo: '120 kW DC',
    capex: 142000,
    consumoMensal: 23040,  // 120 kW × 8h/dia × 80% × 30 dias
    vagas: 2,  // dois bicos = 2 vagas
    foto: FOTO_EP.dcDuplo,
  },
]);

// Revenda de equipamento (NeoCharge) — somente fornecimento, sem operação.
// Preços comerciais arredondados para proposta. Tabela de revenda: 10% lucro
// líquido + 8% imposto + 1% frete + 3% comissão. Entrega 30 a 60 dias.
const EQUIPAMENTOS = Object.freeze([
  { id: 'ndc30',  modelo: 'NDC30-W1B',  nome: 'NeoCharge CCS2 30 kW',  potencia: 30,  preco: 32500 },
  { id: 'ndc40',  modelo: 'NDC40-W1B',  nome: 'NeoCharge CCS2 40 kW',  potencia: 40,  preco: 38900 },
  { id: 'ndc60',  modelo: 'NDC60',      nome: 'NeoCharge CCS2 60 kW',  potencia: 60,  preco: 62000 },
  { id: 'ndc120', modelo: 'NDC120-F2B', nome: 'NeoCharge CCS2 120 kW', potencia: 120, preco: 101900 },
]);
const PRAZO_EQUIPAMENTO = '30 a 60 dias';

const COMBOS_PADRAO = Object.freeze([
  {
    id: 'c60_1ep30',
    nome: '60 kWp + 1 EP 30kW',
    usinaId: 'u60',
    eps: ['ep30'],
    detalhe: 'Sobra 120 kWh/mês para mercado GD',
  },
  {
    id: 'c90_2ep30',
    nome: '90 kWp + 2 EPs 30kW',
    usinaId: 'u90',
    eps: ['ep30', 'ep30'],
    detalhe: 'Complementa 3.400 kWh/mês via Solure',
  },
]);

const FOTOS = Object.freeze({
  usinaTelhado: 'assets/img-usina-telhado.jpg',
  usinaHero: 'assets/img-hero-usina.jpg',
  eletropostoCarro: 'assets/img-eletroposto-carro.jpg',
  eletropostoStation: 'assets/img-eletroposto-station.jpg',
  charger30: FOTO_EP.wallboxPedestal,
  charger60: FOTO_EP.dcHolster,
  charger120: FOTO_EP.dcDuplo,
  logoMark: 'assets/logo-vertus-mark.png',
  logoFull: 'assets/logo-vertus-orange.png',
});

function getUsina(id) {
  return USINAS.find(u => u.id === id);
}
function getEletroposto(id) {
  return ELETROPOSTOS.find(e => e.id === id);
}
function getEquipamento(id) {
  return EQUIPAMENTOS.find(e => e.id === id);
}

// ---------- Quantidades (cenários com N usinas / N eletropostos) ----------
// Teto por modelo no configurador — evita cenário absurdo por clique acidental.
const MAX_QTD = 10;

// Configs antigas (decks salvos) usam `usinaId` (uma usina só). O configurador
// novo manda `usinas: ['u90','u90']`. Tudo passa por aqui antes de calcular.
function normalizarUsinas(config) {
  if (!config) return [];
  if (Array.isArray(config.usinas) && config.usinas.length > 0) return config.usinas.slice();
  if (config.usinaId) return [config.usinaId];
  return [];
}

// Mapa {id: qtd} → array de ids repetidos, na ordem do catálogo
function qtdParaIds(mapa, catalogo) {
  const out = [];
  catalogo.forEach(item => {
    const n = Math.max(0, Math.min(MAX_QTD, (mapa && mapa[item.id]) || 0));
    for (let i = 0; i < n; i++) out.push(item.id);
  });
  return out;
}

// Agrupa ids por um campo do catálogo, preservando a ordem de aparição.
// Retorna [[valorDoCampo, qtd], ...]
function agruparIds(ids, getter, campo) {
  const ordem = [];
  const contagem = {};
  (ids || []).forEach(id => {
    const item = getter(id);
    if (!item) return;
    const chave = item[campo];
    if (!(chave in contagem)) { contagem[chave] = 0; ordem.push(chave); }
    contagem[chave]++;
  });
  return ordem.map(k => [k, contagem[k]]);
}

// Rótulos — fonte única para site, builder e PPTX
function descUsinasCurto(ids) {
  const g = agruparIds(ids, getUsina, 'porte');
  return g.map(([porte, n]) => (n > 1 ? `${n}× ${porte}` : porte)).join(' + ');
}
function descUsinasLongo(ids) {
  const g = agruparIds(ids, getUsina, 'porte');
  if (g.length === 1 && g[0][1] === 1) return `Usina solar ${g[0][0]}`;
  return g.map(([porte, n]) => `${n} usina${n > 1 ? 's' : ''} ${porte}`).join(' + ');
}
function descEpsCurto(ids) {
  const g = agruparIds(ids, getEletroposto, 'potencia');
  return g.map(([p, n]) => `${n} EP ${p}kW`).join(' + ');
}
function descEpsLongo(ids) {
  const g = agruparIds(ids, getEletroposto, 'potencia');
  return g.map(([p, n]) => `${n} eletroposto${n > 1 ? 's' : ''} ${p} kW`).join(' + ');
}

window.VertusCatalog = {
  PREMISES, USINAS, ELETROPOSTOS, EQUIPAMENTOS, PRAZO_EQUIPAMENTO, COMBOS_PADRAO, FOTOS, MAX_QTD,
  getUsina, getEletroposto, getEquipamento,
  normalizarUsinas, qtdParaIds, agruparIds,
  descUsinasCurto, descUsinasLongo, descEpsCurto, descEpsLongo,
};
