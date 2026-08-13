const CONVIDADOS_SHEET_NAME = 'Convidados'

// [id, familia, nome, idadeNota, nota, naoPagante]
const SEED_CONVIDADOS = [
  ['silva-costa-01', 'Família Silva Costa', 'Lucidéa Costa', '', '', false],
  ['silva-costa-02', 'Família Silva Costa', 'José Carlos', '', '', false],
  ['silva-costa-03', 'Família Silva Costa', 'Carlos Tiago', '', '', false],
  ['silva-costa-04', 'Família Silva Costa', 'Silvio Grotto', '', '', false],
  ['silva-costa-05', 'Família Silva Costa', 'Pedro Henrique', '8 anos', '', true],
  ['silva-costa-06', 'Família Silva Costa', 'Artur Miguel', '6 anos', '', true],
  ['silva-costa-07', 'Família Silva Costa', 'Ana Julia', '3 anos', '', true],
  ['silva-costa-08', 'Família Silva Costa', 'Karla Costa', '', '', false],
  ['silva-costa-09', 'Família Silva Costa', 'Iago Cavalcante', '', '', false],
  ['silva-costa-10', 'Família Silva Costa', 'Enzo Gabriel', '7 anos', '', true],
  ['silva-costa-11', 'Família Silva Costa', 'Virgínia Ferreira', '', '', false],
  ['silva-costa-12', 'Família Silva Costa', 'Branca Ferreira', '', '', false],

  ['silva-meireles-01', 'Família Silva Meireles', 'Nazaré Meireles', '', '', false],
  ['silva-meireles-02', 'Família Silva Meireles', 'Romário Meireles', '', '', false],
  ['silva-meireles-03', 'Família Silva Meireles', 'Suellen Meireles', '', '', false],
  ['silva-meireles-04', 'Família Silva Meireles', 'Wendel Meireles', '', '', false],
  ['silva-meireles-05', 'Família Silva Meireles', 'Izabella Silva', '', '', false],

  ['silvia-oliveira-01', 'Família Silvia Oliveira', 'Rui Guilherme', '', '', false],
  ['silvia-oliveira-02', 'Família Silvia Oliveira', 'Ester do Socorro Roldão', '', '', false],
  ['silvia-oliveira-03', 'Família Silvia Oliveira', 'Ririan Silva', '', '', false],
  ['silvia-oliveira-04', 'Família Silvia Oliveira', 'Luís Silva', '', 'Marido Ririan', false],
  ['silvia-oliveira-05', 'Família Silvia Oliveira', 'Lúcio Miguel', '', 'Filho da Ririan', false],
  ['silvia-oliveira-06', 'Família Silvia Oliveira', 'Rivian Silva', '', 'Nem', false],
  ['silvia-oliveira-07', 'Família Silvia Oliveira', 'Victoria Silva', '', 'Filha Nem', false],

  ['silva-pinheiro-01', 'Família Silva Pinheiro', 'Roberto Silva Pinheiro', '', '', false],
  ['silva-pinheiro-02', 'Família Silva Pinheiro', 'Albanizia Pinheiro', '', '', false],
  ['silva-pinheiro-03', 'Família Silva Pinheiro', 'Kaue Pinheiro', '', '', false],
  ['silva-pinheiro-04', 'Família Silva Pinheiro', 'Elizângela Pinheiro', '', 'Ely', false],
  ['silva-pinheiro-05', 'Família Silva Pinheiro', 'Namorado Ely', '', '', false],

  ['silva-pereira-01', 'Família Silva Pereira', 'Raimundo Silva', '', '', false],
  ['silva-pereira-02', 'Família Silva Pereira', 'Nilda Pereira', '', '', false],
  ['silva-pereira-03', 'Família Silva Pereira', 'Mizael Silva', '', '', false],
  ['silva-pereira-04', 'Família Silva Pereira', 'Ruth Silva', '', '', false],
  ['silva-pereira-05', 'Família Silva Pereira', 'Lucas Silva', '', '', false],

  ['silva-senna-01', 'Família Silva Senna', 'Márcio Kleyton', '', '', false],
  ['silva-senna-02', 'Família Silva Senna', 'Michelle Senna', '', '', false],
  ['silva-senna-03', 'Família Silva Senna', 'Maria Zeca', '', '', false],
  ['silva-senna-04', 'Família Silva Senna', 'Adria Senna', '', '', false],
  ['silva-senna-05', 'Família Silva Senna', 'Andreo Sena', '', '', false],

  ['angelim-01', 'Família Angelim', 'Iara Angelim', '', '', false],
  ['angelim-02', 'Família Angelim', 'Luís Angelim', '', '', false],
  ['angelim-03', 'Família Angelim', 'Miguel Angelim', '', '', false],

  ['cavalcante-01', 'Família Cavalcante', 'Daniel Cavalcante', '', '', false],
  ['cavalcante-02', 'Família Cavalcante', 'Brena Cavalcante', '', '', false],
  ['cavalcante-03', 'Família Cavalcante', 'Ester Cavalcante', '8 anos', '', true],
  ['cavalcante-04', 'Família Cavalcante', 'Julia Cavalcante', '6 anos', '', true],
  ['cavalcante-05', 'Família Cavalcante', 'Jonas Cavalcante', '2 anos', '', true],
  ['cavalcante-06', 'Família Cavalcante', 'Danilo Cavalcante', '', '', false],
  ['cavalcante-07', 'Família Cavalcante', 'Ingrid Cavalcante', '', '', false],

  ['franco-01', 'Família Franco', 'Ivo Franco', '', '', false],
  ['franco-02', 'Família Franco', 'Selma Franco', '', '', false],

  ['jacob-01', 'Família Jacob', 'Gabriella Jacob', '', '', false],
  ['jacob-02', 'Família Jacob', 'Renata Jacob', '', '', false],
  ['jacob-03', 'Família Jacob', 'Emília Jacob', '', '', false],

  ['amigos-01', 'Amigos', 'Fátima', '', '', false],
  ['amigos-02', 'Amigos', 'Angélica', '', '', false],
  ['amigos-03', 'Amigos', 'Nado', '', '', false],
  ['amigos-04', 'Amigos', 'Luís Carlos', '', 'irmão do Nado', false],
  ['amigos-05', 'Amigos', 'Larissa Silva', '', '', false],
  ['amigos-06', 'Amigos', 'Augusto Silva', '9 anos', 'Filho da Larissa', true],
  ['amigos-07', 'Amigos', 'Marilene Flexa', '', '', false],
  ['amigos-08', 'Amigos', 'Marilea Flexa', '', '', false],
  ['amigos-09', 'Amigos', 'Carmem Valente', '', '', false],
  ['amigos-10', 'Amigos', 'Edna Ribeiro', '', '', false],
]

function doGet(e) {
  const action = e.parameter.action
  if (action === 'indice') return handleIndice()
  if (action === 'familia') return handleFamilia(e.parameter.id)
  if (action === 'lista') return handleLista(e.parameter.pin)
  return jsonResponse({ ok: false, error: 'ação inválida' })
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  if (body.action !== 'confirmar') {
    return jsonResponse({ ok: false, error: 'ação inválida' })
  }
  return handleConfirmar(Array.isArray(body.ids) ? body.ids.filter(Boolean) : [])
}

function handleIndice() {
  const pessoas = getAllPessoas()
  return jsonResponse({
    ok: true,
    pessoas: pessoas.map((p) => ({ id: p.id, nome: p.nome, familia: p.familia })),
  })
}

function handleFamilia(id) {
  if (!id) return jsonResponse({ ok: false, error: 'id é obrigatório' })
  const pessoas = getAllPessoas()
  const pessoa = pessoas.find((p) => p.id === id)
  if (!pessoa) return jsonResponse({ ok: false, error: 'convidado não encontrado' })
  const membros = pessoas
    .filter((p) => p.familia === pessoa.familia)
    .map(pessoaParaMembro)
  return jsonResponse({ ok: true, familia: pessoa.familia, membros })
}

function handleConfirmar(ids) {
  if (ids.length === 0) {
    return jsonResponse({ ok: false, error: 'nenhum convidado selecionado' })
  }

  const sheet = getConvidadosSheet()
  const range = sheet.getDataRange()
  const values = range.getValues()
  const header = values[0]
  const idIdx = header.indexOf('ID')
  const familiaIdx = header.indexOf('Família')
  const confirmadoIdx = header.indexOf('Confirmado')
  const confirmadoEmIdx = header.indexOf('ConfirmadoEm')

  let familiaAlvo = null
  const now = new Date()
  for (let i = 1; i < values.length; i++) {
    if (ids.indexOf(values[i][idIdx]) === -1) continue
    if (familiaAlvo === null) familiaAlvo = values[i][familiaIdx]
    if (values[i][familiaIdx] !== familiaAlvo) {
      return jsonResponse({ ok: false, error: 'seleção inválida: pessoas de famílias diferentes' })
    }
    if (values[i][confirmadoIdx] !== true) {
      values[i][confirmadoIdx] = true
      values[i][confirmadoEmIdx] = now
    }
  }

  if (familiaAlvo === null) {
    return jsonResponse({ ok: false, error: 'convidado não encontrado' })
  }

  range.setValues(values)

  const membros = values
    .slice(1)
    .filter((row) => row[familiaIdx] === familiaAlvo)
    .map((row) => rowToPessoa(header, row))
    .map(pessoaParaMembro)

  return jsonResponse({ ok: true, familia: familiaAlvo, membros })
}

function handleLista(pin) {
  const expectedPin = PropertiesService.getScriptProperties().getProperty('LISTA_PIN')
  if (!expectedPin || pin !== expectedPin) {
    return jsonResponse({ ok: false, error: 'PIN inválido' })
  }

  const confirmados = getAllPessoas().filter((p) => p.confirmado)
  const porFamilia = {}
  confirmados.forEach((p) => {
    if (!porFamilia[p.familia]) porFamilia[p.familia] = []
    porFamilia[p.familia].push({
      nome: p.nome,
      idadeNota: p.idadeNota,
      nota: p.nota,
      naoPagante: p.naoPagante,
    })
  })
  const familias = Object.keys(porFamilia).map((familia) => ({ familia, membros: porFamilia[familia] }))
  return jsonResponse({ ok: true, familias })
}

function pessoaParaMembro(p) {
  return {
    id: p.id,
    nome: p.nome,
    idadeNota: p.idadeNota,
    nota: p.nota,
    naoPagante: p.naoPagante,
    confirmado: p.confirmado,
  }
}

function seedConvidados() {
  const sheet = getConvidadosSheet()
  if (sheet.getLastRow() > 1) {
    Logger.log('Aba Convidados já tem dados — seed não executado (idempotente).')
    return
  }
  const rows = SEED_CONVIDADOS.map(([id, familia, nome, idadeNota, nota, naoPagante]) => [
    id,
    familia,
    nome,
    idadeNota,
    nota,
    naoPagante,
    false,
    '',
  ])
  sheet.getRange(2, 1, rows.length, 8).setValues(rows)
  Logger.log('Seed concluído: ' + rows.length + ' convidados adicionados.')
}

function getAllPessoas() {
  const sheet = getConvidadosSheet()
  const values = sheet.getDataRange().getValues()
  const header = values[0]
  return values.slice(1).map((row) => rowToPessoa(header, row))
}

function rowToPessoa(header, row) {
  const get = (col) => row[header.indexOf(col)]
  return {
    id: get('ID'),
    familia: get('Família'),
    nome: get('Nome'),
    idadeNota: get('IdadeNota'),
    nota: get('Nota'),
    naoPagante: get('NãoPagante') === true,
    confirmado: get('Confirmado') === true,
  }
}

function getConvidadosSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(CONVIDADOS_SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(CONVIDADOS_SHEET_NAME)
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Família', 'Nome', 'IdadeNota', 'Nota', 'NãoPagante', 'Confirmado', 'ConfirmadoEm'])
  }
  return sheet
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
