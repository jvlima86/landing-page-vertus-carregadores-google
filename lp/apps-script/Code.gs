/**
 * Vertus — receptor de leads das landings de anúncio (Meta Ads)
 *
 * Como publicar (5 minutos):
 * 1. Crie uma planilha nova no Google Sheets (ex.: "Leads Meta Ads · Vertus").
 * 2. Extensões → Apps Script. Apague o conteúdo e cole este arquivo.
 * 3. Implantar → Nova implantação → Tipo: "App da Web".
 *    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa".
 * 4. Copie a URL do app da Web (termina em /exec) e cole em lp/lp.js → CONFIG.lpSheetUrl.
 * 5. Envie um teste pela landing. Cada landing cria a própria aba (eletroposto, hibrido, usina)
 *    com cabeçalho automático a partir dos campos recebidos.
 *
 * Colunas fixas no início: data, lp, produto, nome, whatsapp, cidade, email, origem, pagina, utm_*, fbclid.
 * As respostas de qualificação entram como colunas com o texto da pergunta.
 */

var FIXED = ['data', 'lp', 'produto', 'nome', 'whatsapp', 'cidade', 'email', 'origem', 'pagina',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];

function safe(v) {
  v = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; // neutraliza fórmulas
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var p = (e && e.parameter) || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tab = (p.lp || 'leads').toString().replace(/[^\w-]/g, '').slice(0, 40) || 'leads';
    var sheet = ss.getSheetByName(tab) || ss.insertSheet(tab);

    // Cabeçalho: fixos + qualquer chave nova (perguntas de qualificação)
    var extra = Object.keys(p).filter(function (k) { return FIXED.indexOf(k) < 0 && ['interesse', 'profissao', 'pretencao'].indexOf(k) < 0 && /^[\w À-ÿ]{1,40}$/.test(k); }).sort().slice(0, 12);
    var wanted = FIXED.concat(extra);
    var lastCol = sheet.getLastColumn();
    var header = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    if (!header.length) { sheet.appendRow(wanted); header = wanted; sheet.setFrozenRows(1); }
    else {
      var missing = wanted.filter(function (k) { return header.indexOf(k) < 0; });
      if (missing.length) { sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]); header = header.concat(missing); }
    }

    var row = header.map(function (k) {
      if (k === 'data') { var dt = new Date(p.data); return isNaN(dt) ? new Date() : dt; }
      return p[k] !== undefined ? safe(p[k]) : '';
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, tab: tab })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet() {
  return ContentService.createTextOutput('Vertus LP leads: use POST.').setMimeType(ContentService.MimeType.TEXT);
}
