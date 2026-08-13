# Confirmação por família — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text RSVP form with a closed guest list (11 families, 64 people, transcribed from the birthday PDF) where a confirmer types their own name, the app finds their family, and they mark who from that family is attending — with per-person confirmation state that persists across multiple people confirming for the same family.

**Architecture:** A new "Convidados" tab in the existing Google Sheet becomes the single source of truth for both guest identity and confirmation state (replacing the old "Confirmações" log). The Apps Script backend (`Code.gs`) gains four actions (`indice`, `familia`, `confirmar`, `lista`) instead of the old `rsvp`/`list` pair. The frontend `ConfirmarPresenca` becomes a two-step flow: `BuscaConvidado` (name autocomplete against a lightweight index) → `SelecaoFamilia` (checklist of family members, already-confirmed ones locked). `Lista.jsx` is regrouped by família with separate pagante/não-pagante totals.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, plain `fetch`, Google Apps Script + Google Sheets (existing deployment, same Web App URL and `LISTA_PIN`).

## Global Constraints

- Guest list is closed: the public form never lets someone add a person who isn't in the "Convidados" sheet — no free-text acompanhante field anymore.
- Once a person's `Confirmado` flag is `true`, the public form can never set it back to `false` — no uncheck/edit flow (correction happens by editing the sheet directly, out of scope for the app).
- No automatic block at 60 pagantes — `/lista` shows the count (`X/60`) but never prevents a confirmation.
- Reuse the existing Google Sheet, existing Apps Script project, and existing Web App deployment URL — do **not** create a new deployment or change `VITE_APPS_SCRIPT_URL`. Only the code inside `Code.gs` and the sheet's tabs change. Redeploying means "Implantar > Gerenciar implantações > editar a implantação existente > Nova versão", which keeps the URL stable.
- The old "Confirmações" tab and its data are discarded (no real confirmations exist yet, confirmed by the user) — the new "Convidados" tab is seeded fresh via `seedConvidados()`.
- POST requests to the Apps Script Web App must keep using `Content-Type: text/plain;charset=utf-8` (avoids a CORS preflight Apps Script doesn't handle).
- No automated test suite, matching the existing project convention — verification is manual: `npm run dev` + browser, plus `curl`/PowerShell hitting the live Apps Script URL for backend checks.
- `seedConvidados()` must be idempotent (skip if the "Convidados" tab already has data rows) so re-running it by accident never wipes real confirmations.

---

### Task 1: Backend rewrite — Convidados sheet, seed data, and endpoints

**Files:**
- Modify: `apps-script/Code.gs` (full rewrite)
- Modify: `apps-script/README.md` (full rewrite — now describes updating an existing deployment, not first-time setup)

**Interfaces:**
- Consumes: nothing (foundational task)
- Produces (HTTP contract used by Task 3's `rsvpApi.js`):
  - `GET ?action=indice` → `{ ok: true, pessoas: [{ id, nome, familia }] }`
  - `GET ?action=familia&id=<id>` → `{ ok: true, familia: string, membros: [{ id, nome, idadeNota, nota, naoPagante, confirmado }] }` or `{ ok: false, error }`
  - `POST { action: 'confirmar', ids: string[] }` → `{ ok: true, familia: string, membros: [...] }` (same shape as above) or `{ ok: false, error }`
  - `GET ?action=lista&pin=<pin>` → `{ ok: true, familias: [{ familia, membros: [{ nome, idadeNota, nota, naoPagante }] }] }` (confirmed people only) or `{ ok: false, error }`

- [ ] **Step 1: Replace `apps-script/Code.gs` entirely**

```js
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
```

- [ ] **Step 2: Replace `apps-script/README.md` entirely**

```markdown
# Deploy do backend (Google Apps Script)

Este projeto já está no ar com uma planilha e um deployment existentes. Estes passos atualizam o código e os dados, mantendo a mesma URL (não é preciso mexer em `.env.local` nem no Vercel).

1. Abra a planilha existente (a que já está ligada ao deployment atual) e vá em **Extensões > Apps Script**.
2. Apague todo o conteúdo de `Code.gs` no editor e cole o conteúdo deste repositório em `apps-script/Code.gs`.
3. Salve (Ctrl+S / ícone de disquete).
4. No topo do editor, escolha a função `seedConvidados` no menu suspenso de funções e clique em **Executar**. Na primeira vez, autorize as permissões pedidas.
   - Isso cria a aba "Convidados" na planilha e preenche as 64 pessoas.
   - É seguro rodar de novo por engano: se a aba já tiver dados, a função não faz nada (idempotente).
5. (Opcional) Apague a aba antiga "Confirmações" da planilha — não tem dados reais e não é mais usada pelo código.
6. Clique em **Implantar > Gerenciar implantações**, clique no ícone de lápis (editar) na implantação existente, em **Versão** escolha **Nova versão**, e clique em **Implantar**. Isso atualiza o código por trás da URL já existente, sem gerar uma URL nova.

## Verificar que funcionou

Troque `SEU_PIN` e `<URL>` pelos valores reais (o PIN está em **Configurações do projeto > Propriedades do script > LISTA_PIN**, a URL é a mesma já usada em `VITE_APPS_SCRIPT_URL`).

- Índice de nomes: abra `<URL>?action=indice` — deve retornar `{"ok":true,"pessoas":[...64 itens...]}`.
- Família de uma pessoa: abra `<URL>?action=familia&id=silva-costa-01` — deve retornar a família "Família Silva Costa" com os 12 membros, todos `"confirmado":false`.
- Lista do organizador: abra `<URL>?action=lista&pin=SEU_PIN` — deve retornar `{"ok":true,"familias":[]}` (ninguém confirmou ainda).
- PIN errado: abra `<URL>?action=lista&pin=0000` — deve retornar `{"ok":false,"error":"PIN inválido"}`.
```

- [ ] **Step 3: Perform the manual redeploy**

Follow the updated `apps-script/README.md` exactly, using the existing Google account/project. At the end:
- The "Convidados" tab exists in the sheet with a header row plus 64 data rows, all `Confirmado = FALSE`.
- The old "Confirmações" tab is gone (or at least no longer used).
- The same Web App URL now serves the new code (redeployed as a new version of the existing deployment).

- [ ] **Step 4: Verify the live endpoints**

Run each of these (replace `<URL>` with the real deployment URL and `<PIN>` with the real `LISTA_PIN` value):

```bash
curl "<URL>?action=indice"
curl "<URL>?action=familia&id=silva-costa-01"
curl "<URL>?action=lista&pin=<PIN>"
curl "<URL>?action=lista&pin=0000"
```

Expected:
- `action=indice` → `ok:true`, `pessoas` array with 64 entries, each `{id, nome, familia}`.
- `action=familia&id=silva-costa-01` → `ok:true`, `familia:"Família Silva Costa"`, `membros` array with 12 entries, all `confirmado:false`.
- `action=lista&pin=<PIN>` → `ok:true`, `familias:[]` (empty, nobody confirmed yet).
- `action=lista&pin=0000` → `ok:false`, `error:"PIN inválido"`.

Then test the POST endpoint (replace `<URL>`):

```bash
curl -X POST "<URL>" -H "Content-Type: text/plain;charset=utf-8" -d '{"action":"confirmar","ids":["silva-costa-01","silva-costa-02"]}'
```

Expected: `ok:true`, `familia:"Família Silva Costa"`, and in `membros` the entries with `id:"silva-costa-01"` and `id:"silva-costa-02"` now show `confirmado:true` (the rest still `false`). Re-run the exact same curl command a second time — expected: same success response, `confirmado:true` stays `true` for those two (idempotent, no duplicate side effects).

Open `<URL>?action=lista&pin=<PIN>` again — expected: now shows one família ("Família Silva Costa") with those 2 people.

**Reset for the next tasks:** open the "Convidados" sheet tab directly and manually set `Confirmado` back to `FALSE` and clear `ConfirmadoEm` for `silva-costa-01` and `silva-costa-02` (the two rows you just tested), so later manual testing in Tasks 6–7 starts from a clean slate.

- [ ] **Step 5: Commit**

```bash
git add apps-script/Code.gs apps-script/README.md
git commit -m "feat: replace RSVP log with per-person family guest list backend"
```

---

### Task 2: `normalizeNome` util

**Files:**
- Create: `src/utils/normalize.js`

**Interfaces:**
- Consumes: nothing
- Produces: `normalizeNome(str: string): string` — lowercases, trims, and strips accents (used by Task 4's autocomplete matching)

- [ ] **Step 1: Create `src/utils/normalize.js`**

```js
export function normalizeNome(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
```

- [ ] **Step 2: Verify with a scratch check**

Run: `node -e "import('./src/utils/normalize.js').then(m => console.log(m.normalizeNome('  Lucidéa Costa  ')))"`
Expected: prints `lucidea costa`

Run: `node -e "import('./src/utils/normalize.js').then(m => console.log(m.normalizeNome('JOSÉ CARLOS') === m.normalizeNome('jose carlos')))"`
Expected: prints `true`

- [ ] **Step 3: Commit**

```bash
git add src/utils/normalize.js
git commit -m "feat: add accent-insensitive name normalization util"
```

---

### Task 3: `rsvpApi.js` rewrite

**Files:**
- Modify: `src/utils/rsvpApi.js` (full rewrite)

**Interfaces:**
- Consumes: `APPS_SCRIPT_URL` from `src/utils/config.js`; the live endpoints from Task 1
- Produces:
  - `fetchIndice(): Promise<Array<{id, nome, familia}>>` — throws `Error` on failure
  - `fetchFamilia(id: string): Promise<{familia: string, membros: Array<{id, nome, idadeNota, nota, naoPagante, confirmado}>}>` — throws `Error` on failure
  - `confirmarPresencas(ids: string[]): Promise<{familia: string, membros: Array<{id, nome, idadeNota, nota, naoPagante, confirmado}>}>` — throws `Error` on failure
  - `fetchLista(pin: string): Promise<Array<{familia: string, membros: Array<{nome, idadeNota, nota, naoPagante}>}>>` — throws `Error` on failure (replaces old `fetchGuestList`)

- [ ] **Step 1: Replace `src/utils/rsvpApi.js` entirely**

```js
import { APPS_SCRIPT_URL } from './config'

export async function fetchIndice() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=indice`)
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'Falha ao carregar lista de convidados')
  }
  return data.pessoas
}

export async function fetchFamilia(id) {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=familia&id=${encodeURIComponent(id)}`)
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'Convidado não encontrado')
  }
  return { familia: data.familia, membros: data.membros }
}

export async function confirmarPresencas(ids) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'confirmar', ids }),
  })
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'Falha ao confirmar presença')
  }
  return { familia: data.familia, membros: data.membros }
}

export async function fetchLista(pin) {
  const url = `${APPS_SCRIPT_URL}?action=lista&pin=${encodeURIComponent(pin)}`
  const response = await fetch(url)
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'PIN inválido')
  }
  return data.familias
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/rsvpApi.js
git commit -m "feat: rewrite rsvpApi client for family-based endpoints"
```

---

### Task 4: `BuscaConvidado` component (name autocomplete)

**Files:**
- Create: `src/components/BuscaConvidado.jsx`

**Interfaces:**
- Consumes: `fetchIndice` from `src/utils/rsvpApi.js` (Task 3); `normalizeNome` from `src/utils/normalize.js` (Task 2)
- Produces: `BuscaConvidado` (default export), props: `{ onSelecionar: (pessoa: {id, nome, familia}) => void }`

- [ ] **Step 1: Create `src/components/BuscaConvidado.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { fetchIndice } from '../utils/rsvpApi'
import { normalizeNome } from '../utils/normalize'

export default function BuscaConvidado({ onSelecionar }) {
  const [indice, setIndice] = useState([])
  const [status, setStatus] = useState('loading')
  const [termo, setTermo] = useState('')

  useEffect(() => {
    carregarIndice()
  }, [])

  async function carregarIndice() {
    setStatus('loading')
    try {
      const pessoas = await fetchIndice()
      setIndice(pessoas)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  const termoNormalizado = normalizeNome(termo.trim())
  const sugestoes =
    termoNormalizado.length >= 2
      ? indice.filter((p) => normalizeNome(p.nome).includes(termoNormalizado)).slice(0, 8)
      : []

  return (
    <div>
      <label className="block text-sm text-white/70 mb-2">Digite seu nome</label>
      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
        placeholder="Seu nome completo"
        disabled={status === 'loading'}
      />

      {status === 'loading' && <p className="text-white/50 text-sm mt-3">Carregando lista de convidados...</p>}

      {status === 'error' && (
        <p className="text-red-400 text-sm mt-3">
          Não foi possível carregar a lista.{' '}
          <button type="button" onClick={carregarIndice} className="underline text-amber-400">
            Tentar de novo
          </button>
        </p>
      )}

      {status === 'ready' && termoNormalizado.length >= 2 && (
        <div className="mt-3 space-y-2">
          {sugestoes.length === 0 && (
            <p className="text-white/50 text-sm">
              Não encontramos esse nome. Confira a grafia ou fale com a organização.
            </p>
          )}
          {sugestoes.map((pessoa) => (
            <button
              key={pessoa.id}
              type="button"
              onClick={() => onSelecionar(pessoa)}
              className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 rounded-lg px-4 py-3 text-white transition-colors"
            >
              {pessoa.nome} <span className="text-white/50 text-sm">— {pessoa.familia}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in isolation via a temporary wiring into `Home`**

Edit `src/pages/Home.jsx` temporarily to render `<BuscaConvidado onSelecionar={(p) => console.log('selecionado', p)} />` somewhere visible (you'll replace this wiring properly in Task 6 — this is just to see the component work).

Run: `npm run dev`, open `http://localhost:5173/`. Type "luc" — expected: after the backend from Task 1 is live, suggestions appear including "Lucidéa Costa — Família Silva Costa". Click it — expected: the browser console logs the selected `{id, nome, familia}` object. Type a nonsense name like "zzzzz" — expected: "Não encontramos esse nome..." message. Stop the dev server. Revert the temporary edit to `Home.jsx` (Task 6 wires it properly).

- [ ] **Step 3: Commit**

```bash
git add src/components/BuscaConvidado.jsx
git commit -m "feat: add name autocomplete search component"
```

---

### Task 5: `SelecaoFamilia` component (family checklist + submit)

**Files:**
- Create: `src/components/SelecaoFamilia.jsx`

**Interfaces:**
- Consumes: `fetchFamilia`, `confirmarPresencas` from `src/utils/rsvpApi.js` (Task 3)
- Produces: `SelecaoFamilia` (default export), props: `{ pessoa: {id, nome, familia}, onConfirmado: (resultado: {familia, membros}) => void, onVoltar: () => void }`

- [ ] **Step 1: Create `src/components/SelecaoFamilia.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { fetchFamilia, confirmarPresencas } from '../utils/rsvpApi'

export default function SelecaoFamilia({ pessoa, onConfirmado, onVoltar }) {
  const [familiaData, setFamiliaData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [selecionados, setSelecionados] = useState(new Set())
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    carregarFamilia()
  }, [pessoa.id])

  async function carregarFamilia() {
    setStatus('loading')
    try {
      const data = await fetchFamilia(pessoa.id)
      setFamiliaData(data)
      setSelecionados(new Set())
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  function toggleMembro(id) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    setSubmitStatus('loading')
    setErrorMessage('')
    try {
      const result = await confirmarPresencas([...selecionados])
      onConfirmado(result)
    } catch (err) {
      setSubmitStatus('error')
      setErrorMessage(err.message)
    }
  }

  if (status === 'loading') {
    return <p className="text-white/60 text-sm">Carregando sua família...</p>
  }

  if (status === 'error') {
    return (
      <div>
        <p className="text-red-400 text-sm mb-3">{errorMessage}</p>
        <button type="button" onClick={carregarFamilia} className="text-amber-400 underline text-sm">
          Tentar de novo
        </button>
      </div>
    )
  }

  const todosConfirmados = familiaData.membros.every((m) => m.confirmado)

  return (
    <div>
      <button type="button" onClick={onVoltar} className="text-sm text-white/50 hover:text-white/80 mb-4">
        ← não sou eu / voltar
      </button>

      <h3 className="text-lg font-semibold text-amber-400 mb-1">{familiaData.familia}</h3>

      {todosConfirmados ? (
        <p className="text-white/70 mt-4">Sua família já confirmou presença de todo mundo! 🥂</p>
      ) : (
        <>
          <p className="text-sm text-white/60 mb-4">Marque quem vai à festa:</p>
          <div className="space-y-2">
            {familiaData.membros.map((membro) => {
              const nota = [membro.idadeNota, membro.nota].filter(Boolean).join(' — ')
              return (
                <label
                  key={membro.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    membro.confirmado
                      ? 'border-white/10 bg-white/[0.02] opacity-60'
                      : 'border-white/15 bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={membro.confirmado || selecionados.has(membro.id)}
                    disabled={membro.confirmado}
                    onChange={() => toggleMembro(membro.id)}
                    className="w-5 h-5"
                  />
                  <span className="text-white">
                    {membro.nome}
                    {nota && <span className="text-white/50 text-sm"> ({nota})</span>}
                  </span>
                  {membro.confirmado && <span className="ml-auto text-xs text-amber-400">já confirmado</span>}
                </label>
              )
            })}
          </div>

          {submitStatus === 'error' && (
            <p className="text-red-400 text-sm mt-4">{errorMessage} — tente novamente.</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={selecionados.size === 0 || submitStatus === 'loading'}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {submitStatus === 'loading' ? 'Enviando...' : 'Confirmar presença'}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

(No isolated manual check here — Task 6 wires this into the real flow and verifies it end-to-end, since it needs `BuscaConvidado`'s output as input.)

```bash
git add src/components/SelecaoFamilia.jsx
git commit -m "feat: add family member selection component"
```

---

### Task 6: `ConfirmarPresenca` orchestrator rewrite + end-to-end flow verification

**Files:**
- Modify: `src/components/ConfirmarPresenca.jsx` (full rewrite)

**Interfaces:**
- Consumes: `RSVP_DEADLINE` from `src/utils/config.js`; `isRsvpOpen` from `src/utils/deadline.js`; `BuscaConvidado` (Task 4); `SelecaoFamilia` (Task 5)
- Produces: `ConfirmarPresenca` (default export, no props) — `src/pages/Home.jsx` already imports this from `'../components/ConfirmarPresenca'`, no change needed there.

- [ ] **Step 1: Replace `src/components/ConfirmarPresenca.jsx` entirely**

```jsx
import { useState } from 'react'
import { RSVP_DEADLINE } from '../utils/config'
import { isRsvpOpen } from '../utils/deadline'
import BuscaConvidado from './BuscaConvidado'
import SelecaoFamilia from './SelecaoFamilia'

export default function ConfirmarPresenca() {
  const [step, setStep] = useState('busca')
  const [pessoaEscolhida, setPessoaEscolhida] = useState(null)
  const [resultado, setResultado] = useState(null)

  const open = isRsvpOpen(RSVP_DEADLINE)

  function handleSelecionar(pessoa) {
    setPessoaEscolhida(pessoa)
    setStep('selecao')
  }

  function handleVoltar() {
    setPessoaEscolhida(null)
    setStep('busca')
  }

  function handleConfirmado(result) {
    setResultado(result)
    setStep('sucesso')
  }

  if (!open) {
    return (
      <section id="confirmar" className="relative overflow-hidden border-t border-amber-500/10 bg-velvet/25 px-5 py-20 text-center">
        <div className="max-w-xl mx-auto bg-white/[0.06] border border-amber-500/25 rounded-2xl p-10">
          <h2 className="font-display text-2xl font-semibold text-gold-gradient mb-2">Prazo de confirmação encerrado</h2>
          <p className="text-white/70">O prazo para confirmar presença já passou. Qualquer dúvida, fale direto com a gente.</p>
        </div>
      </section>
    )
  }

  if (step === 'sucesso') {
    return (
      <section id="confirmar" className="relative overflow-hidden border-t border-amber-500/10 bg-velvet/25 px-5 py-20 text-center">
        <div className="max-w-xl mx-auto bg-white/[0.06] border border-amber-500/25 rounded-2xl p-10">
          <h2 className="font-display text-2xl font-semibold text-gold-gradient mb-2">Presença confirmada! 🥂</h2>
          <p className="text-white/70 mb-4">Te esperamos no Cabaré da Lucidéa!</p>
          <ul className="text-left text-white/80 text-sm space-y-1 max-w-xs mx-auto">
            {resultado.membros
              .filter((m) => m.confirmado)
              .map((m) => (
                <li key={m.id}>✓ {m.nome}</li>
              ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section id="confirmar" className="relative overflow-hidden border-t border-amber-500/10 bg-velvet/25 px-5 py-20 text-center">
      <div className="max-w-xl mx-auto">
        <h2 className="font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">Confirme sua presença</h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
          Precisamos da sua confirmação até <strong className="text-amber-400">07/10</strong> para reservar o seu lugar na plateia.
        </p>
        <div className="mt-9 text-left bg-white/[0.06] border border-amber-500/25 rounded-2xl p-8">
          {step === 'busca' && <BuscaConvidado onSelecionar={handleSelecionar} />}
          {step === 'selecao' && (
            <SelecaoFamilia pessoa={pessoaEscolhida} onConfirmado={handleConfirmado} onVoltar={handleVoltar} />
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: End-to-end verification against the live backend**

Run: `npm run dev`, open `http://localhost:5173/`, scroll to "Confirme sua presença".

- Type "kaue" → expected: one suggestion, "Kaue Pinheiro — Família Silva Pinheiro". Click it.
- Expected: the family screen loads showing all 5 "Família Silva Pinheiro" members as unchecked checkboxes (none confirmed yet, assuming you reset the test rows at the end of Task 1).
- Check "Kaue Pinheiro" and "Elizângela Pinheiro (Ely)", click "Confirmar presença".
- Expected: success screen listing exactly those two names with a ✓.
- Reload the page, search "kaue" again, select him again.
- Expected: the family screen now shows "Kaue Pinheiro" and "Elizângela Pinheiro" as locked/checked with a "já confirmado" tag, and the other 3 members still open as unchecked checkboxes.
- Check "Roberto Silva Pinheiro", submit.
- Expected: success screen shows only "Roberto Silva Pinheiro" (the newly confirmed one, not the two that were already locked).
- Search a nonsense name like "qwerty" → expected: "Não encontramos esse nome..." message, no crash.
- Temporarily set `RSVP_DEADLINE` in `src/utils/config.js` to a past date, reload, confirm the "Prazo de confirmação encerrado" message replaces the whole flow. Revert the change afterward.
- Open DevTools mobile viewport (~375px width) and confirm the search input, suggestion list, and checkboxes stay usable with no horizontal scroll.

Stop the dev server. Open the "Convidados" sheet and manually reset the "Família Silva Pinheiro" rows (`Confirmado` back to `FALSE`, clear `ConfirmadoEm`) so Task 7's verification also starts clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfirmarPresenca.jsx
git commit -m "feat: wire search and family selection into confirmation flow"
```

---

### Task 7: `Lista.jsx` rewrite — grouped by família with pagante/não-pagante totals

**Files:**
- Modify: `src/pages/Lista.jsx` (full rewrite)

**Interfaces:**
- Consumes: `fetchLista` from `src/utils/rsvpApi.js` (Task 3)
- Produces: `Lista` (default export, no props) — `src/App.jsx` already imports this, no change needed there.

- [ ] **Step 1: Replace `src/pages/Lista.jsx` entirely**

```jsx
import { useState } from 'react'
import { fetchLista } from '../utils/rsvpApi'

export default function Lista() {
  const [pin, setPin] = useState('')
  const [familias, setFamilias] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchLista(pin)
      setFamilias(data)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  if (!familias) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <form onSubmit={handleSubmit} className="bg-white/5 border border-amber-500/30 rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-amber-400 text-center">Lista de convidados</h1>
          <input
            type="password"
            inputMode="numeric"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white text-center tracking-widest focus:border-amber-400 focus:outline-none"
          />
          {status === 'error' && <p className="text-red-400 text-sm text-center">{errorMessage}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {status === 'loading' ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
      </div>
    )
  }

  const totalPagantes = familias.reduce(
    (sum, f) => sum + f.membros.filter((m) => !m.naoPagante).length,
    0,
  )
  const totalNaoPagantes = familias.reduce(
    (sum, f) => sum + f.membros.filter((m) => m.naoPagante).length,
    0,
  )

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <div className="no-print flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de convidados — Cabaré da Lucidéa</h1>
        <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 rounded-lg">
          Imprimir
        </button>
      </div>
      <p className="mb-6 font-semibold">
        Pagantes confirmados: {totalPagantes}/60 · Não pagantes confirmados: {totalNaoPagantes}
      </p>
      {familias.map((f) => (
        <div key={f.familia} className="mb-6">
          <h2 className="text-lg font-bold mb-2">{f.familia}</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-4 w-10">✓</th>
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Observação</th>
              </tr>
            </thead>
            <tbody>
              {f.membros.map((m, i) => {
                const nota = [m.idadeNota, m.nota].filter(Boolean).join(' — ')
                return (
                  <tr key={i} className="border-b border-black/20">
                    <td className="py-2 pr-4">
                      <span className="inline-block w-5 h-5 border-2 border-black" />
                    </td>
                    <td className="py-2 pr-4">{m.nome}</td>
                    <td className="py-2 pr-4">
                      {nota}
                      {m.naoPagante && <span className="ml-2 text-xs text-black/60">(não pagante)</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: End-to-end verification against the live backend**

Run: `npm run dev`, open `http://localhost:5173/`. Confirm 2 members of one family (e.g. search "ivo" → "Ivo Franco — Família Franco", confirm both "Ivo Franco" and "Selma Franco"). Also confirm a non-pagante child (e.g. search "pedro henrique" and confirm "Pedro Henrique" together with at least one other Silva Costa member).

Open `http://localhost:5173/lista`. Enter a wrong PIN → expected: "PIN inválido" error. Enter the correct PIN → expected:
- A white printable page grouped by família — "Família Franco" section showing "Ivo Franco" and "Selma Franco"; "Família Silva Costa" section showing "Pedro Henrique — 8 anos (não pagante)" and whoever else you confirmed.
- The top line shows correct counts: **Pagantes confirmados** excludes Pedro Henrique from its count; **Não pagantes confirmados** includes him.
- Click "Imprimir" (or Ctrl+P) → expected: the header bar (title + button + PIN form) is hidden in print preview, only the totals line and família tables remain in black on white.

Stop the dev server. Open the "Convidados" sheet and reset every row you confirmed during Tasks 6–7 testing back to `Confirmado = FALSE` / empty `ConfirmadoEm`, so the site starts with zero real confirmations before being shared with the family.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Lista.jsx
git commit -m "feat: regroup lista by familia with pagante/nao-pagante totals"
```

---

## Post-plan operational note (not a task)

Before sharing the `/` link with the family, double-check the "Convidados" sheet has all `Confirmado` cells set to `FALSE` (no leftover test data from Tasks 1, 6, or 7). About 3 hours before the party, open `/lista`, enter the PIN, review, and print/save the final list for the reception desk.
