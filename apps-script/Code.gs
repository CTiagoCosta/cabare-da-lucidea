const SHEET_NAME = 'Confirmações'

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  if (body.action !== 'rsvp') {
    return jsonResponse({ ok: false, error: 'ação inválida' })
  }
  const nome = (body.nome || '').trim()
  if (!nome) {
    return jsonResponse({ ok: false, error: 'nome é obrigatório' })
  }
  const acompanhantes = Array.isArray(body.acompanhantes)
    ? body.acompanhantes.map((a) => String(a).trim()).filter(Boolean)
    : []
  const total = 1 + acompanhantes.length

  const sheet = getSheet()
  sheet.appendRow([new Date(), nome, acompanhantes.join(', '), total])
  return jsonResponse({ ok: true })
}

function doGet(e) {
  const action = e.parameter.action
  if (action !== 'list') {
    return jsonResponse({ ok: false, error: 'ação inválida' })
  }
  const expectedPin = PropertiesService.getScriptProperties().getProperty('LISTA_PIN')
  const pin = e.parameter.pin
  if (!expectedPin || pin !== expectedPin) {
    return jsonResponse({ ok: false, error: 'PIN inválido' })
  }

  const sheet = getSheet()
  const rows = sheet.getDataRange().getValues()
  const guests = rows.slice(1).map((row) => ({
    timestamp: row[0],
    nome: row[1],
    acompanhantes: row[2] ? String(row[2]).split(', ').filter(Boolean) : [],
    total: row[3],
  }))
  return jsonResponse({ ok: true, guests })
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Nome', 'Acompanhantes', 'Total'])
  }
  return sheet
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
