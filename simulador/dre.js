/* ESPELHO de apresentacao-comercial-eletroposto-usina-1/dre.js (commit 0f66196) — NÃO EDITAR AQUI.
   A fonte única de premissas e do motor é a apresentação comercial; para atualizar:
   git -C ~/Programas/apresentacao-comercial-eletroposto-usina-1 show HEAD:dre.js > simulador/dre.js (e recolocar este cabeçalho). */
/* Vertus — Motor de cálculo do DRE
 * Funções puras. Recebem configuração e retornam estrutura financeira completa.
 */

(function() {
  const { PREMISES, getUsina, getEletroposto, normalizarUsinas } = window.VertusCatalog;

  // Total de vagas (bicos) dos EPs — 60/80/120 kW têm 2 bicos = 2 vagas
  function totalVagas(eps) {
    return eps.reduce((s, e) => s + (e.vagas || 1), 0);
  }

  // Aceita id único ('u60') ou lista ('u90','u90') — cenários com N usinas.
  function resolverUsinas(entrada) {
    const ids = Array.isArray(entrada) ? entrada : (entrada ? [entrada] : []);
    const usinas = ids.map(id => getUsina(id));
    const faltando = ids.filter((id, i) => !usinas[i]);
    if (faltando.length) throw new Error('Usina não encontrada: ' + faltando.join(', '));
    return usinas;
  }

  // Cada usina é uma unidade independente: capex, geração, obra civil, O&M e
  // disponibilidade (fio B) somam por unidade — são UCs e projetos separados.
  function totaisUsinas(usinas) {
    return {
      qtd: usinas.length,
      capexBase: usinas.reduce((s, u) => s + u.capexBase, 0),
      obraCivil: usinas.reduce((s, u) => s + u.obraCivil, 0),
      geracao: usinas.reduce((s, u) => s + u.geracaoMensal, 0),
      potencia: usinas.reduce((s, u) => s + u.potencia, 0),
    };
  }

  // Capex consolidado dos EPs com bundle pricing (2× ep30 = PREMISES.bundle2xEp30)
  function calcCapexEPs(eps) {
    const ep30Count = eps.filter(e => e.id === 'ep30').length;
    const ep30Pairs = Math.floor(ep30Count / 2);
    const ep30Singles = ep30Count % 2;
    const ep30Total = ep30Pairs * PREMISES.bundle2xEp30 + ep30Singles * getEletroposto('ep30').capex;
    const outrosTotal = eps
      .filter(e => e.id !== 'ep30')
      .reduce((s, e) => s + e.capex, 0);
    return ep30Total + outrosTotal;
  }

  // Cenário 1 — Somente Usina (energia vai 100% para mercado GD de assinantes)
  // usinaIds aceita id único ou lista — N usinas contam como N unidades.
  function calcularUsina(usinaIds, comObraCivil) {
    const usinas = resolverUsinas(usinaIds);
    if (!usinas.length) throw new Error('Nenhuma usina informada');
    const tot = totaisUsinas(usinas);

    const investimento = tot.capexBase + (comObraCivil ? tot.obraCivil : 0);
    const receitaBruta = tot.geracao * PREMISES.tarifaVenda;
    const desconto = receitaBruta * PREMISES.descontoGD;
    const receitaLiquida = receitaBruta - desconto;
    const om = tot.capexBase * PREMISES.omAnual / 12;
    // Imposto sobre receita bruta − ADM Vertus − taxas da plataforma. Usina pura não
    // tem ADM/Tupi; base = receita bruta GD (referência, antes do desconto ao assinante).
    const baseImposto = receitaBruta;
    const impostos = baseImposto * PREMISES.impostos;
    // Fio B é por UC: cada usina tem a sua conexão
    const disponibilidade = PREMISES.disponibilidade * tot.qtd;
    const lucroMensal = receitaLiquida - om - impostos - disponibilidade;

    return {
      modo: 'usina',
      admVertusPct: 0,          // usina pura não tem receita de recarga
      usina: usinas[0],       // compatibilidade com código que espera uma usina
      usinas,
      usinasQtd: tot.qtd,
      usinasCapexBase: tot.capexBase,
      usinasObraCivil: comObraCivil ? tot.obraCivil : 0,
      potenciaTotal: tot.potencia,
      capexUsina: investimento,
      omBase: tot.capexBase,
      comObraCivil,
      investimento,
      baseImposto,
      energia: {
        geracao: tot.geracao,
        paraGD: tot.geracao,
        paraEPs: 0,
        complementarSolure: 0,
      },
      receita: {
        bruta: receitaBruta,
        desconto,
        liquida: receitaLiquida,
        gd: receitaLiquida,
        recarga: 0,
      },
      custos: {
        energiaPropria: 0,
        energiaSolure: 0,
        plataforma: 0,
        aluguel: 0,
        om,
        impostos,
        disponibilidade,
      },
      lucroMensal,
      retornoMensalPct: (lucroMensal / investimento) * 100,
      paybackMeses: investimento / lucroMensal,
      retorno5Anos: lucroMensal * 60,
      retorno25Anos: lucroMensal * 300,
    };
  }

  // Cenário 2 — Usina + 1 ou mais Eletropostos
  // Energia da usina vai prioritariamente para os EPs.
  // Sobra → mercado GD. Déficit → energia complementar Solure.
  // usinaPropria = cliente já possui a usina; não entra no investimento (mas O&M e
  // disponibilidade continuam sendo cobrados, pois a usina existe e opera).
  function calcularUsinaComEPs(usinaIds, epIds, comObraCivil, comAluguel = true, usinaPropria = false, valorUsinaCliente = 0, precoRecargaOverride = 0, kwhVendidoOverride = 0) {
    const usinas = resolverUsinas(usinaIds);
    if (!usinas.length) throw new Error('Nenhuma usina informada');
    const tot = totaisUsinas(usinas);
    const eps = epIds.map(id => getEletroposto(id));
    if (eps.some(e => !e)) throw new Error('Eletroposto não encontrado');

    // Overrides do configurador (sliders): preço de venda e kWh vendido/mês
    const precoRecarga = precoRecargaOverride > 0 ? precoRecargaOverride : PREMISES.precoRecarga;

    // Cliente já tem a usina: se informar o valor dela, ela entra no investimento
    // total e volta a contar (excedente GD vira receita + O&M sobre esse valor).
    const usaValorCliente = usinaPropria && valorUsinaCliente > 0;
    const capexUsina = usinaPropria
      ? (usaValorCliente ? valorUsinaCliente : 0)
      : tot.capexBase + (comObraCivil ? tot.obraCivil : 0);
    const capexEPs = calcCapexEPs(eps);
    const investimento = capexUsina + capexEPs;

    // Balanço de energia (kWh vendido pode vir do slider do configurador)
    const geracao = tot.geracao;
    const consumoEPs = kwhVendidoOverride > 0 ? kwhVendidoOverride : eps.reduce((s, e) => s + e.consumoMensal, 0);
    const paraEPs = consumoEPs;
    const energiaPropriaUsada = Math.min(geracao, consumoEPs);
    const complementarSolure = Math.max(0, consumoEPs - geracao);
    const paraGD = Math.max(0, geracao - consumoEPs);

    // Bloco GD (excedente) — zerado só quando o cliente já tem a usina E NÃO informou
    // o valor dela (aí o excedente é benefício pré-existente, não receita deste deal).
    // Informando o valor, a usina entra no investimento e o excedente vira receita.
    const paraGDInvest = (usinaPropria && !usaValorCliente) ? 0 : paraGD;
    const receitaBrutaGD = paraGDInvest * PREMISES.tarifaVenda;
    const descontoGD = receitaBrutaGD * PREMISES.descontoGD;
    const receitaLiquidaGD = receitaBrutaGD - descontoGD;

    // Bloco Eletropostos
    const receitaRecarga = consumoEPs * precoRecarga;
    const admVertus = receitaRecarga * PREMISES.admVertusCombo;  // ADM sobre a recarga (usina + EP)
    const custoEnergiaPropria = energiaPropriaUsada * PREMISES.custoEnergiaPropria;
    const custoEnergiaSolure = complementarSolure * PREMISES.custoEnergiaSolure;
    const plataforma = eps.length * PREMISES.plataformaFixa + receitaRecarga * PREMISES.plataformaVariavel;
    const vagas = totalVagas(eps);
    const aluguel = comAluguel ? vagas * PREMISES.aluguelVaga : 0;
    const margemEPs = receitaRecarga - admVertus - custoEnergiaPropria - custoEnergiaSolure - plataforma - aluguel;

    // Consolidação
    const receitaLiquida = receitaLiquidaGD + margemEPs;
    const omBase = usaValorCliente ? valorUsinaCliente : tot.capexBase;
    const om = omBase * PREMISES.omAnual / 12;
    // Imposto sobre receita bruta − ADM Vertus − taxas da plataforma (Tupi).
    // EP: recarga − adm − plataforma. GD: receita bruta (referência, sem ADM/Tupi).
    const baseImposto = (receitaRecarga - admVertus - plataforma) + receitaBrutaGD;
    const impostos = baseImposto * PREMISES.impostos;
    // Fio B é por UC: cada usina tem a sua conexão
    const disponibilidade = PREMISES.disponibilidade * tot.qtd;
    const lucroMensal = receitaLiquida - om - impostos - disponibilidade;

    return {
      modo: 'usina+eps',
      admVertusPct: PREMISES.admVertusCombo,
      usinaPropria,
      comAluguel,
      usina: usinas[0],       // compatibilidade com código que espera uma usina
      usinas,
      usinasQtd: tot.qtd,
      usinasCapexBase: tot.capexBase,
      usinasObraCivil: comObraCivil && !usinaPropria ? tot.obraCivil : 0,
      potenciaTotal: tot.potencia,
      eps,
      vagasTotal: vagas,
      comObraCivil,
      investimento,
      capexUsina,
      capexEPs,
      valorUsinaCliente: usaValorCliente ? valorUsinaCliente : 0,
      omBase,
      baseImposto,
      precoRecarga,
      energia: {
        geracao,
        paraGD: paraGDInvest,
        paraEPs,
        complementarSolure,
        energiaPropriaUsada,
      },
      receita: {
        brutaGD: receitaBrutaGD,
        descontoGD,
        liquidaGD: receitaLiquidaGD,
        recarga: receitaRecarga,
        liquida: receitaLiquida,
        margemEPs,
      },
      custos: {
        energiaPropria: custoEnergiaPropria,
        energiaSolure: custoEnergiaSolure,
        admVertus,
        plataforma,
        aluguel,
        om,
        impostos,
        disponibilidade,
      },
      lucroMensal,
      retornoMensalPct: (lucroMensal / investimento) * 100,
      paybackMeses: investimento / lucroMensal,
      retorno5Anos: lucroMensal * 60,
      retorno25Anos: lucroMensal * 300,
    };
  }

  // Cenário 3 — Somente Eletroposto(s) sem usina (toda energia comprada da Solure)
  function calcularEletropostoSolo(epIds, comAluguel = true, precoRecargaOverride = 0, kwhVendidoOverride = 0) {
    const eps = epIds.map(id => getEletroposto(id));
    if (eps.some(e => !e)) throw new Error('Eletroposto não encontrado');

    const investimento = calcCapexEPs(eps);

    // Overrides do configurador (sliders): preço de venda e kWh vendido/mês
    const precoRecarga = precoRecargaOverride > 0 ? precoRecargaOverride : PREMISES.precoRecarga;
    const consumoEPs = kwhVendidoOverride > 0 ? kwhVendidoOverride : eps.reduce((s, e) => s + e.consumoMensal, 0);
    // Sem usina, 100% do consumo vem da Solure
    const complementarSolure = consumoEPs;

    const receitaRecarga = consumoEPs * precoRecarga;
    const admVertus = receitaRecarga * PREMISES.admVertusEPSolo;  // ADM sobre a recarga (EP solo)
    const custoEnergiaSolure = consumoEPs * PREMISES.custoEnergiaSolure;
    const plataforma = eps.length * PREMISES.plataformaFixa + receitaRecarga * PREMISES.plataformaVariavel;
    const vagas = totalVagas(eps);
    const aluguel = comAluguel ? vagas * PREMISES.aluguelVaga : 0;
    const margemEPs = receitaRecarga - admVertus - custoEnergiaSolure - plataforma - aluguel;

    const receitaLiquida = margemEPs;
    // Sem usina: sem O&M e sem disponibilidade (fio B é da conexão da usina)
    const om = 0;
    // Imposto sobre faturamento bruto − ADM Vertus − taxas da plataforma (Tupi)
    const baseImposto = receitaRecarga - admVertus - plataforma;
    const impostos = baseImposto * PREMISES.impostos;
    const disponibilidade = 0;
    const lucroMensal = receitaLiquida - om - impostos - disponibilidade;

    return {
      modo: 'eps-solo',
      admVertusPct: PREMISES.admVertusEPSolo,
      comAluguel,
      usina: null,
      usinas: [],
      usinasQtd: 0,
      usinasCapexBase: 0,
      usinasObraCivil: 0,
      potenciaTotal: 0,
      eps,
      vagasTotal: vagas,
      comObraCivil: false,
      investimento,
      baseImposto,
      precoRecarga,
      capexUsina: 0,
      capexEPs: investimento,
      energia: {
        geracao: 0,
        paraGD: 0,
        paraEPs: consumoEPs,
        complementarSolure,
        energiaPropriaUsada: 0,
      },
      receita: {
        brutaGD: 0,
        descontoGD: 0,
        liquidaGD: 0,
        recarga: receitaRecarga,
        liquida: receitaLiquida,
        margemEPs,
      },
      custos: {
        energiaPropria: 0,
        energiaSolure: custoEnergiaSolure,
        admVertus,
        plataforma,
        aluguel,
        om,
        impostos,
        disponibilidade,
      },
      lucroMensal,
      retornoMensalPct: (lucroMensal / investimento) * 100,
      paybackMeses: investimento / lucroMensal,
      retorno5Anos: lucroMensal * 60,
      retorno25Anos: lucroMensal * 300,
    };
  }

  // Cenário individual do EP 30kW (4h/dia conservador) — para slide opcional
  function calcularEP30Conservador() {
    const ep = getEletroposto('ep30');
    const consumo = 30 * 4 * 0.80 * 30; // 2.880 kWh/mês
    const receita = consumo * PREMISES.precoRecarga;
    const admVertus = receita * PREMISES.admVertusEPSolo;  // ADM sobre a recarga (EP solo)
    const energia = consumo * PREMISES.custoEnergiaPropria;
    const plataforma = PREMISES.plataformaFixa + receita * PREMISES.plataformaVariavel;
    const aluguel = PREMISES.aluguelVaga;
    const margem = receita - admVertus - energia - plataforma - aluguel;
    // Imposto sobre faturamento bruto − ADM Vertus − taxas da plataforma (Tupi)
    const baseImposto = receita - admVertus - plataforma;
    const impostos = baseImposto * PREMISES.impostos;
    const lucro = margem - impostos;
    return {
      consumo,
      receita,
      admVertus,
      admVertusPct: PREMISES.admVertusEPSolo,
      energia,
      plataforma,
      aluguel,
      margem,
      baseImposto,
      impostos,
      lucro,
      paybackMeses: ep.capex / lucro,
      investimento: ep.capex,
    };
  }

  // Parcelamento do eletroposto — lê PREMISES (nº de parcelas, juros e meio de pagamento).
  // `condicao` é o sufixo exibido ao lado da parcela em site, PPTX e conhecimento:
  // "sem juros no cartão" (juros = 0) ou "com juros de 15% no cartão".
  function parcelamentoEP(valor) {
    const juros = PREMISES.jurosParcelamentoEP;
    const total = valor * (1 + juros);
    const meio = PREMISES.parcelamentoEPMeio || '';
    const condicao = (juros > 0 ? 'com juros de ' + taxa(juros) : 'sem juros') + (meio ? ' ' + meio : '');
    return {
      parcelas: PREMISES.parcelasEP,
      juros,
      meio,
      condicao,
      total,
      valorParcela: total / PREMISES.parcelasEP,
    };
  }

  // Roteador: detecta cenário pela configuração.
  // `usinas: ['u90','u90']` (novo) ou `usinaId: 'u90'` (decks antigos) — normalizarUsinas
  // resolve os dois formatos.
  function calcular(config) {
    const comAluguel = config.comAluguel !== false;  // default: cobra aluguel de vaga
    const usinas = normalizarUsinas(config);
    // Somente EPs (sem usina)
    if (usinas.length === 0 && config.eps && config.eps.length > 0) {
      return calcularEletropostoSolo(config.eps, comAluguel, config.precoRecarga || 0, config.kwhVendido || 0);
    }
    // Somente usina
    if (!config.eps || config.eps.length === 0) {
      return calcularUsina(usinas, config.comObraCivil);
    }
    // Usina + EPs (usinaPropria = cliente já tem a usina; valorUsinaCliente opcional)
    return calcularUsinaComEPs(usinas, config.eps, config.comObraCivil, comAluguel, !!config.usinaPropria, config.valorUsinaCliente || 0, config.precoRecarga || 0, config.kwhVendido || 0);
  }

  // Formatação
  function brl(v, decimais = 2) {
    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
    });
  }
  function brlCompact(v) {
    if (Math.abs(v) >= 1000000) return 'R$ ' + (v / 1000000).toFixed(2).replace('.', ',') + ' mi';
    if (Math.abs(v) >= 1000) return 'R$ ' + (v / 1000).toFixed(0) + 'k';
    return brl(v, 0);
  }
  function pct(v, decimais = 2) {
    return v.toFixed(decimais).replace('.', ',') + '%';
  }
  // Taxa em fração (0.09) → rótulo curto ("9%"); 0.055 → "5,5%"
  function taxa(fracao) {
    return (fracao * 100).toFixed(2).replace(/0+$/, '').replace(/[.,]$/, '').replace('.', ',') + '%';
  }
  function kwh(v) {
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' kWh';
  }
  function meses(v) {
    return '~' + Math.round(v) + ' meses';
  }

  window.VertusDRE = {
    calcular,
    calcularUsina,
    calcularUsinaComEPs,
    calcularEletropostoSolo,
    calcularEP30Conservador,
    parcelamentoEP,
    fmt: { brl, brlCompact, pct, taxa, kwh, meses },
  };
})();
