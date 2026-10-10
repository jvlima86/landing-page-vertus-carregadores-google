/* Vertus Mob — dados únicos das páginas de motorista (/motoristas e /motorista-app).
   Mudou preço, estação ou WhatsApp? Altere SÓ aqui: as duas páginas leem este arquivo.
   Regra do dono (05/10/2026): mostrar o preço que fica para o motorista de app (precoApp), nunca o percentual de desconto. */
window.VertusMotoristas = {
  // WhatsApp do bot do CRM que valida o print e libera o cupom (a palavra "cupom" na mensagem dispara o fluxo).
  WA_NUMBER: '5585996163937',
  WA_DISPLAY: '(85) 99616-3937',
  WA_COUPON_MSG: 'Olá! Sou motorista de aplicativo e quero o cupom de motorista da Vertus Mob. Vou enviar o print do meu perfil.',
  MAPS_KEY: 'AIzaSyDzn3uYW2NljaXXjcAV39Ad_yPwr9q1QXs',

  // Apps de recarga (a chave é o valor de `app` em cada estação). Links conferidos nas lojas em 09/10/2026.
  APPS: {
    'Tupi': { nome: 'Tupi Recarga', android: 'https://play.google.com/store/apps/details?id=com.tupinamba', ios: 'https://apps.apple.com/br/app/id1499575119' },
    'V Recargas': { nome: 'V Recargas', android: 'https://play.google.com/store/apps/details?id=app.vrecargas', ios: 'https://apps.apple.com/br/app/id6783077410' },
  },

  // Eletropostos abertos ao público (condomínios ficam de fora: são de uso dos moradores).
  // lat/lng null = sem coordenada confirmada: aparece na lista e a rota usa o texto em `rota`.
  // preco = preço público; precoApp = preço para motorista de app (com o cupom). Sem valor = "no app".
  // emBreve: true = ainda não está operando (pino tracejado, fora do "mais perto de mim").
  ESTACOES: [
    { id: 'cometa', nome: 'Cometa Barão do Rio Branco', endereco: 'R. Barão do Rio Branco, 2841 · Fátima', cidade: 'Fortaleza', lat: -3.7428723, lng: -38.5333842, potencia: '60 kW · 2 conectores', conector: 'CCS2', app: 'Tupi' },
    { id: 'lauro-maia', nome: 'Posto Lauro Maia', endereco: 'R. Lauro Maia, 700 · Fátima', cidade: 'Fortaleza', lat: -3.7466703, lng: -38.5232352, potencia: '60 kW · 2 conectores', conector: 'CCS2', app: 'V Recargas', preco: 'R$ 1,79/kWh', precoApp: 'R$ 1,29/kWh' },
    { id: 'pamil', nome: 'Pamil Parque Araxá', endereco: 'R. Padre Cícero, 750 · Rodolfo Teófilo', cidade: 'Fortaleza', lat: -3.7408827, lng: -38.548699, potencia: '22 kW', conector: 'Tipo 2 (AC)', app: 'Tupi' },
    { id: 'vila-peri', nome: 'Eletroposto Vila Peri', endereco: 'R. Eça de Queirós, 803 · Vila Peri', cidade: 'Fortaleza', lat: -3.7894335, lng: -38.5854335, potencia: '30 kW', conector: 'CCS2', app: 'Tupi' },
    { id: 'guara-theberge', nome: 'Super Guará Theberge', endereco: 'Av. Dr. Theberge, 2111 · Presidente Kennedy', cidade: 'Fortaleza', lat: -3.7227558, lng: -38.5670778, app: 'V Recargas', emBreve: true },
    { id: 'arena-celio-santos', nome: 'Arena Célio Santos', endereco: 'São Benedito', cidade: 'Ceará', lat: -3.9977185, lng: -40.8764746, preco: 'R$ 2,09/kWh', precoApp: 'R$ 1,89/kWh' },
  ],
};
