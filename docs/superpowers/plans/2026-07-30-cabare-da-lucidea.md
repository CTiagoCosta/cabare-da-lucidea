# Cabaré da Lucidéa — RSVP Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a small React site for "Cabaré da Lucidéa" (75th birthday) that shows the party details in the invite's theatre/cabaret theme, collects RSVPs (name + named companions) into a Google Sheet via a Google Apps Script Web App, and provides a PIN-gated `/lista` page the organizer can open ~3h before the party to print a check-in list.

**Architecture:** Single-page React app (Vite + Tailwind CSS) with a minimal path-based router (no router library) splitting `/` (landing + RSVP form) from `/lista` (PIN-gated printable guest list). All persistence goes through one Google Apps Script Web App bound to a Google Sheet: `doPost` appends RSVPs, `doGet` returns the list after PIN validation. Deployed statically to Vercel with a SPA rewrite so `/lista` resolves correctly.

**Tech Stack:** React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), plain `fetch`, Google Apps Script (Code.gs) + Google Sheets, Vercel.

## Global Constraints

- Party date/time: 2026-10-17T13:00:00 (Sábado, 17 de outubro de 2026, a partir das 13h).
- RSVP deadline: 2026-10-07T23:59:59 — after this, the form is replaced by a closed message (client-side check only, per spec).
- Venue: Imperial Recepções e Eventos — Av. Pedro Álvares Cabral, 5220.
- Visual theme: theatre/cabaret — red curtain, gold/amber, black stage background. Headings in a serif display font (Playfair Display), body in Inter.
- No automated test suite — per spec's "Testes / verificação" section, verification is manual: run `npm run dev` and check behavior in the browser for every task.
- No RSVP edit/cancel flow, no deduplication, no real authentication — out of scope per spec.
- `/lista` is protected only by a lightweight PIN compared server-side in Apps Script (via Script Properties) — never hardcode the PIN in frontend code.
- POST to the Apps Script Web App must use `Content-Type: text/plain;charset=utf-8` (avoids a CORS preflight that Apps Script Web Apps don't handle).
- `VITE_APPS_SCRIPT_URL` is read from environment (`.env.local` locally, Vercel project env var in production) — never hardcode the deployment URL in source.

---

### Task 1: Scaffold project + minimal router

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/pages/Home.jsx`
- Create: `src/pages/Lista.jsx`
- Create: `src/index.css`

**Interfaces:**
- Produces: `App` (default export, no props) — renders `Home` for any path except `/lista`, which renders `Lista`.
- Produces: `Home` (default export, no props) — placeholder `<main>` for now, fleshed out in Task 6.
- Produces: `Lista` (default export, no props) — placeholder `<div>` for now, fleshed out in Task 9.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cabare-da-lucidea",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tailwindcss/vite": "^4.2.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "tailwindcss": "^4.2.2",
    "vite": "^8.0.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 3: Create `eslint.config.js`**

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🎭 Cabaré da Lucidéa</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `.gitignore`**

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

- [ ] **Step 6: Create `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800&display=swap');
@import "tailwindcss";

* {
  scroll-behavior: smooth;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: #0a0505;
  color: white;
}

.font-serif {
  font-family: 'Playfair Display', serif;
}

#root {
  width: 100%;
  min-height: 100vh;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #0a0505;
}
::-webkit-scrollbar-thumb {
  background: #d4a441;
  border-radius: 3px;
}

@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
}
```

- [ ] **Step 7: Create `src/pages/Home.jsx`**

```jsx
export default function Home() {
  return <main>Home placeholder</main>
}
```

- [ ] **Step 8: Create `src/pages/Lista.jsx`**

```jsx
export default function Lista() {
  return <div>Lista placeholder</div>
}
```

- [ ] **Step 9: Create `src/App.jsx`**

```jsx
import Home from './pages/Home'
import Lista from './pages/Lista'

function App() {
  const path = window.location.pathname
  if (path === '/lista') {
    return <Lista />
  }
  return <Home />
}

export default App
```

- [ ] **Step 10: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Install dependencies and verify dev server**

Run: `npm install`
Then run: `npm run dev`
Expected: Vite prints a local URL (e.g. `http://localhost:5173/`). Open it in a browser — you should see the plain text "Home placeholder". Then open `http://localhost:5173/lista` — you should see "Lista placeholder". Stop the dev server (Ctrl+C).

- [ ] **Step 12: Commit**

```bash
git add package.json vite.config.js eslint.config.js index.html .gitignore src
git commit -m "chore: scaffold Vite + React + Tailwind project with minimal router"
```

---

### Task 2: Shared config and pure utils (countdown, deadline)

**Files:**
- Create: `src/utils/config.js`
- Create: `src/utils/countdown.js`
- Create: `src/utils/deadline.js`

**Interfaces:**
- Consumes: nothing (pure, no dependencies on other tasks)
- Produces: `PARTY_NAME: string`, `PARTY_DATE: Date`, `RSVP_DEADLINE: Date`, `VENUE_NAME: string`, `VENUE_ADDRESS: string`, `APPS_SCRIPT_URL: string | undefined` from `src/utils/config.js`
- Produces: `getCountdown(targetDate: Date, now?: Date): { days, hours, minutes, seconds } | null` from `src/utils/countdown.js`
- Produces: `isRsvpOpen(deadline: Date, now?: Date): boolean` from `src/utils/deadline.js`

- [ ] **Step 1: Create `src/utils/config.js`**

```js
export const PARTY_NAME = 'Cabaré da Lucidéa'
export const PARTY_DATE = new Date('2026-10-17T13:00:00')
export const RSVP_DEADLINE = new Date('2026-10-07T23:59:59')
export const VENUE_NAME = 'Imperial Recepções e Eventos'
export const VENUE_ADDRESS = 'Av. Pedro Álvares Cabral, 5220'
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL
```

- [ ] **Step 2: Create `src/utils/countdown.js`**

```js
export function getCountdown(targetDate, now = new Date()) {
  const diff = targetDate - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}
```

- [ ] **Step 3: Create `src/utils/deadline.js`**

```js
export function isRsvpOpen(deadline, now = new Date()) {
  return now <= deadline
}
```

- [ ] **Step 4: Verify with a scratch check**

Run: `node -e "import('./src/utils/countdown.js').then(m => console.log(m.getCountdown(new Date('2026-10-17T13:00:00'), new Date('2026-10-10T13:00:00'))))"`
Expected: prints `{ days: 7, hours: 0, minutes: 0, seconds: 0 }`

Run: `node -e "import('./src/utils/deadline.js').then(m => console.log(m.isRsvpOpen(new Date('2026-10-07T23:59:59'), new Date('2026-10-08T00:00:00'))))"`
Expected: prints `false`

- [ ] **Step 5: Commit**

```bash
git add src/utils/config.js src/utils/countdown.js src/utils/deadline.js
git commit -m "feat: add party config and countdown/deadline utils"
```

---

### Task 3: Hero component

**Files:**
- Create: `src/components/Hero.jsx`

**Interfaces:**
- Consumes: `PARTY_NAME`, `PARTY_DATE` from `src/utils/config.js` (Task 2); `getCountdown` from `src/utils/countdown.js` (Task 2)
- Produces: `Hero` (default export, no props)

- [ ] **Step 1: Create `src/components/Hero.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { PARTY_NAME, PARTY_DATE } from '../utils/config'
import { getCountdown } from '../utils/countdown'

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/40 backdrop-blur-sm border border-amber-500/40 rounded-2xl px-4 py-3 min-w-[70px] text-center">
        <span className="text-3xl md:text-4xl font-black tabular-nums text-amber-400">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-white/60 mt-2 uppercase tracking-widest">{label}</span>
    </div>
  )
}

export default function Hero() {
  const [countdown, setCountdown] = useState(getCountdown(PARTY_DATE))

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown(PARTY_DATE)), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2b0508] via-[#160203] to-black" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-700/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <div className="inline-block bg-black/40 backdrop-blur-sm border border-amber-500/40 rounded-full px-4 py-2 text-sm text-amber-300 font-medium mb-8 tracking-widest uppercase">
          ✦ Sábado, 17 de outubro · a partir das 13h ✦
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-black mb-4 leading-tight">
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            {PARTY_NAME}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/70 mt-2 mb-12 font-medium">
          Você faz parte da minha história e com você quero brindar esse momento especial!
        </p>

        {countdown && (
          <div className="flex gap-4 justify-center mb-12">
            <CountdownBox value={countdown.days} label="Dias" />
            <CountdownBox value={countdown.hours} label="Horas" />
            <CountdownBox value={countdown.minutes} label="Min" />
            <CountdownBox value={countdown.seconds} label="Seg" />
          </div>
        )}

        <a
          href="#confirmar"
          className="inline-block bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-amber-900/40"
        >
          Confirmar presença
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire it into `Home` temporarily to view it**

Edit `src/pages/Home.jsx`:

```jsx
import Hero from '../components/Hero'

export default function Home() {
  return (
    <main>
      <Hero />
    </main>
  )
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Open `http://localhost:5173/`. Expected: dark red/black gradient hero, "Cabaré da Lucidéa" in gold serif, the invite phrase, a live countdown ticking down every second toward 2026-10-17 13:00, and a "Confirmar presença" gold button. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.jsx src/pages/Home.jsx
git commit -m "feat: add Hero section with countdown"
```

---

### Task 4: LocalFesta component

**Files:**
- Create: `src/components/LocalFesta.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `VENUE_NAME`, `VENUE_ADDRESS` from `src/utils/config.js` (Task 2)
- Produces: `LocalFesta` (default export, no props)

- [ ] **Step 1: Create `src/components/LocalFesta.jsx`**

```jsx
import { VENUE_NAME, VENUE_ADDRESS } from '../utils/config'

export default function LocalFesta() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`)}`

  return (
    <section id="local" className="py-20 px-6 bg-black">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold text-amber-400 mb-8">Onde vai ser</h2>
        <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-8">
          <p className="text-xl font-semibold text-white mb-2">{VENUE_NAME}</p>
          <p className="text-white/70 mb-6">{VENUE_ADDRESS}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-full transition-all"
          >
            Ver no mapa
          </a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into `Home`**

Edit `src/pages/Home.jsx`:

```jsx
import Hero from '../components/Hero'
import LocalFesta from '../components/LocalFesta'

export default function Home() {
  return (
    <main>
      <Hero />
      <LocalFesta />
    </main>
  )
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, open `http://localhost:5173/`, scroll down (or click "Confirmar presença" — it will 404-scroll since `#confirmar` doesn't exist yet, that's expected). Expected: below the hero, a black section titled "Onde vai ser" with "Imperial Recepções e Eventos", the address, and a "Ver no mapa" button. Click it — expected: opens Google Maps in a new tab with the venue searched. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/LocalFesta.jsx src/pages/Home.jsx
git commit -m "feat: add LocalFesta section with Google Maps link"
```

---

### Task 5: RSVP API client + ConfirmarPresenca form

**Files:**
- Create: `src/utils/rsvpApi.js`
- Create: `src/components/ConfirmarPresenca.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `APPS_SCRIPT_URL`, `RSVP_DEADLINE` from `src/utils/config.js` (Task 2); `isRsvpOpen` from `src/utils/deadline.js` (Task 2)
- Produces: `submitRsvp({ nome: string, acompanhantes: string[] }): Promise<void>` from `src/utils/rsvpApi.js` — throws `Error` with a user-facing message on failure
- Produces: `fetchGuestList(pin: string): Promise<Array<{ timestamp, nome, acompanhantes: string[], total: number }>>` from `src/utils/rsvpApi.js` — throws `Error` on invalid PIN or failure (used by Task 9)
- Produces: `ConfirmarPresenca` (default export, no props)

- [ ] **Step 1: Create `src/utils/rsvpApi.js`**

```js
import { APPS_SCRIPT_URL } from './config'

export async function submitRsvp({ nome, acompanhantes }) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'rsvp', nome, acompanhantes }),
  })
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'Falha ao confirmar presença')
  }
}

export async function fetchGuestList(pin) {
  const url = `${APPS_SCRIPT_URL}?action=list&pin=${encodeURIComponent(pin)}`
  const response = await fetch(url)
  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || 'PIN inválido')
  }
  return data.guests
}
```

- [ ] **Step 2: Create `src/components/ConfirmarPresenca.jsx`**

```jsx
import { useState } from 'react'
import { RSVP_DEADLINE } from '../utils/config'
import { isRsvpOpen } from '../utils/deadline'
import { submitRsvp } from '../utils/rsvpApi'

export default function ConfirmarPresenca() {
  const [nome, setNome] = useState('')
  const [acompanhantes, setAcompanhantes] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const open = isRsvpOpen(RSVP_DEADLINE)

  function addAcompanhante() {
    setAcompanhantes((prev) => [...prev, ''])
  }

  function updateAcompanhante(index, value) {
    setAcompanhantes((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  function removeAcompanhante(index) {
    setAcompanhantes((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      await submitRsvp({
        nome: nome.trim(),
        acompanhantes: acompanhantes.map((a) => a.trim()).filter(Boolean),
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  if (!open) {
    return (
      <section id="confirmar" className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto bg-white/5 border border-amber-500/30 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-amber-400 mb-2">Prazo de confirmação encerrado</h2>
          <p className="text-white/70">O prazo para confirmar presença já passou. Qualquer dúvida, fale direto com a gente.</p>
        </div>
      </section>
    )
  }

  if (status === 'success') {
    return (
      <section id="confirmar" className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto bg-white/5 border border-amber-500/30 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-amber-400 mb-2">Presença confirmada! 🥂</h2>
          <p className="text-white/70">Te esperamos no Cabaré da Lucidéa!</p>
        </div>
      </section>
    )
  }

  return (
    <section id="confirmar" className="py-20 px-6">
      <div className="max-w-xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-amber-400 mb-8">Confirmar presença</h2>
        <form onSubmit={handleSubmit} className="bg-white/5 border border-amber-500/30 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-white/70 mb-2">Seu nome</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Acompanhantes</label>
            <div className="space-y-3">
              {acompanhantes.map((acompanhante, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={acompanhante}
                    onChange={(e) => updateAcompanhante(index, e.target.value)}
                    className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                    placeholder={`Nome do acompanhante ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeAcompanhante(index)}
                    className="px-4 rounded-lg border border-white/20 text-white/60 hover:text-red-400 hover:border-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addAcompanhante}
              className="mt-3 text-sm text-amber-400 hover:text-amber-300"
            >
              + adicionar acompanhante
            </button>
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMessage} — tente novamente.</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando...' : 'Confirmar presença'}
          </button>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Wire into `Home`**

Edit `src/pages/Home.jsx`:

```jsx
import Hero from '../components/Hero'
import LocalFesta from '../components/LocalFesta'
import ConfirmarPresenca from '../components/ConfirmarPresenca'

export default function Home() {
  return (
    <main>
      <Hero />
      <LocalFesta />
      <ConfirmarPresenca />
    </main>
  )
}
```

- [ ] **Step 4: Verify form behavior without a real backend**

Run: `npm run dev`, open `http://localhost:5173/`, scroll to "Confirmar presença". Expected:
- Clicking "+ adicionar acompanhante" adds a new input; the "✕" button removes it.
- Typing a name and submitting with `APPS_SCRIPT_URL` still undefined shows an error message below the form (fetch will fail against `undefined` — that's expected at this stage, confirms the error state renders correctly) instead of a blank crash.
- Temporarily edit `src/utils/config.js` to set `RSVP_DEADLINE` to a past date (e.g. `'2020-01-01'`), reload the page, and confirm the "Prazo de confirmação encerrado" message replaces the form. Revert the change to `2026-10-07T23:59:59` afterward.
- Open the browser DevTools device toolbar (mobile viewport, e.g. iPhone SE width ~375px) and confirm the Hero, LocalFesta and form sections stay readable and usable (inputs full-width, no horizontal scroll, buttons tappable) — most guests will open the link from WhatsApp on a phone.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/utils/rsvpApi.js src/components/ConfirmarPresenca.jsx src/pages/Home.jsx
git commit -m "feat: add RSVP form with dynamic companions and deadline gating"
```

---

### Task 6: Google Apps Script backend (code + manual deployment)

**Files:**
- Create: `apps-script/Code.gs`
- Create: `apps-script/README.md`

**Interfaces:**
- Produces: a deployed Web App URL (external, not a file) that Task 7 wires into `.env.local` as `VITE_APPS_SCRIPT_URL`, and a PIN value stored in the Apps Script's Script Properties as `LISTA_PIN`, which the organizer chooses and remembers (needed to open `/lista` later, Task 9).

This task has a code part (committed to the repo for reference/version control) and a manual part (you, not an automated step, do this in the Google UI — Apps Script has no CLI access from this environment).

- [ ] **Step 1: Write `apps-script/Code.gs`**

```js
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
```

- [ ] **Step 2: Write `apps-script/README.md` with deployment instructions**

```markdown
# Deploy do backend (Google Apps Script)

Passos manuais (feitos uma vez, direto no navegador com sua conta Google):

1. Acesse https://sheets.google.com e crie uma planilha nova. Nomeie como "Cabaré da Lucidéa — RSVPs".
2. Na planilha, vá em **Extensões > Apps Script**.
3. Apague o conteúdo padrão de `Code.gs` e cole o conteúdo deste repositório em `apps-script/Code.gs`.
4. No editor do Apps Script, vá em **Configurações do projeto** (ícone de engrenagem) > **Propriedades do script** > **Adicionar propriedade do script**.
   - Propriedade: `LISTA_PIN`
   - Valor: escolha um PIN numérico (ex: 4 dígitos) — anote esse PIN, você vai precisar dele para abrir a página `/lista` no dia da festa.
5. Clique em **Implantar > Nova implantação**.
   - Tipo: **App da Web**.
   - Executar como: **Eu** (sua conta).
   - Quem pode acessar: **Qualquer pessoa**.
6. Clique em **Implantar**, autorize as permissões pedidas (é a sua própria planilha, é seguro), e copie a **URL do app da Web** gerada — algo como `https://script.google.com/macros/s/XXXXXXXX/exec`.
7. Guarde essa URL — ela vai para `VITE_APPS_SCRIPT_URL` no Task 7.

## Verificar que funcionou

Abra a URL copiada no navegador, adicionando `?action=list&pin=SEU_PIN` no final (troque `SEU_PIN` pelo valor que você definiu). Deve retornar um JSON como:

```json
{"ok":true,"guests":[]}
```

Se o PIN estiver errado, deve retornar `{"ok":false,"error":"PIN inválido"}`.

Volte na planilha — uma aba chamada "Confirmações" deve ter sido criada automaticamente, com o cabeçalho `Timestamp, Nome, Acompanhantes, Total`.
```

- [ ] **Step 3: Perform the manual deployment**

Follow `apps-script/README.md` exactly, using your own Google account. At the end you should have:
- A Google Sheet with a "Confirmações" tab (created automatically on first access, or you can open the Apps Script URL once to trigger it).
- A `LISTA_PIN` script property set to a PIN you'll remember.
- A Web App deployment URL.

Verify: open `<your-deployment-url>?action=list&pin=<your-pin>` in a browser — expected response `{"ok":true,"guests":[]}`.

- [ ] **Step 4: Commit**

```bash
git add apps-script/Code.gs apps-script/README.md
git commit -m "feat: add Google Apps Script backend for RSVP storage"
```

---

### Task 7: Wire frontend to the deployed Apps Script + end-to-end RSVP test

**Files:**
- Create: `.env.example`
- Create: `.env.local` (not committed — matches `*.local` in `.gitignore`)

**Interfaces:**
- Consumes: the Web App URL from Task 6, `submitRsvp` from `src/utils/rsvpApi.js` (Task 5)

- [ ] **Step 1: Create `.env.example`**

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

- [ ] **Step 2: Create `.env.local` with the real URL from Task 6**

```
VITE_APPS_SCRIPT_URL=<cole aqui a URL de implantação copiada no Task 6>
```

- [ ] **Step 3: End-to-end verification against the live Google Sheet**

Run: `npm run dev`, open `http://localhost:5173/`, scroll to "Confirmar presença". Fill in a test name (e.g. "Teste Plano") and add one companion (e.g. "Convidado Teste"). Submit.

Expected:
- The "Presença confirmada! 🥂" success message appears (no error).
- Open the Google Sheet from Task 6 — a new row appears in "Confirmações" with the test name, "Convidado Teste", and total `2`.

Delete the test row from the sheet afterward so it doesn't pollute the real guest list. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add env var template for Apps Script URL"
```

(`.env.local` stays untracked — it's excluded by the `*.local` rule in `.gitignore`.)

---

### Task 8: Lista page — PIN gate + guest table

**Files:**
- Modify: `src/pages/Lista.jsx`

**Interfaces:**
- Consumes: `fetchGuestList` from `src/utils/rsvpApi.js` (Task 5)
- Produces: `Lista` (default export, no props) — replaces the Task 1 placeholder

- [ ] **Step 1: Replace `src/pages/Lista.jsx`**

```jsx
import { useState } from 'react'
import { fetchGuestList } from '../utils/rsvpApi'

export default function Lista() {
  const [pin, setPin] = useState('')
  const [guests, setGuests] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchGuestList(pin)
      setGuests(data)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  const totalPessoas = guests ? guests.reduce((sum, g) => sum + Number(g.total), 0) : 0

  if (!guests) {
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

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <div className="no-print flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de convidados — Cabaré da Lucidéa</h1>
        <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 rounded-lg">
          Imprimir
        </button>
      </div>
      <p className="mb-4 font-semibold">
        Total de confirmados: {guests.length} grupos / {totalPessoas} pessoas
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 pr-4 w-10">✓</th>
            <th className="py-2 pr-4">Titular</th>
            <th className="py-2 pr-4">Acompanhantes</th>
            <th className="py-2 pr-4 w-16">Total</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g, i) => (
            <tr key={i} className="border-b border-black/20">
              <td className="py-2 pr-4">
                <span className="inline-block w-5 h-5 border-2 border-black" />
              </td>
              <td className="py-2 pr-4">{g.nome}</td>
              <td className="py-2 pr-4">{g.acompanhantes.join(', ')}</td>
              <td className="py-2 pr-4">{g.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify against the live sheet**

Run: `npm run dev`, open `http://localhost:5173/lista`. Expected: a black PIN-entry screen. Enter a wrong PIN — expected: "PIN inválido" error message. Enter the correct PIN (from Task 6) — expected: a white printable page with the guest table. If you left the test row from Task 7 in the sheet, add a fresh test RSVP from `/` first, refresh `/lista`, and confirm it shows up with the right companion name and total. Delete any test rows from the sheet afterward. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Lista.jsx
git commit -m "feat: add PIN-gated guest list page"
```

---

### Task 9: Print styling verification

**Files:**
- No new files — verifies CSS already added in Task 1 (`@media print` block in `src/index.css`) against the real `Lista` page from Task 8.

- [ ] **Step 1: Verify print preview**

Run: `npm run dev`, open `http://localhost:5173/lista`, enter the PIN. Click "Imprimir" (or use the browser's print preview directly, e.g. Ctrl+P). Expected: the PIN form, the "Imprimir" button, and the page title bar (everything with class `no-print`) are hidden in the print preview; only the "Total de confirmados" line and the guest table remain, in black text on white background. Cancel the print dialog. Stop the dev server.

- [ ] **Step 2: If anything is missing from the print view, adjust**

If the header row (title + button) still shows in print preview, confirm the `<div className="no-print ...">` wrapper in `src/pages/Lista.jsx` (Task 8, Step 1) is intact and that `src/index.css` still has:

```css
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
}
```

No commit needed for this task unless a fix was required — if you changed anything, commit with:

```bash
git add src/index.css src/pages/Lista.jsx
git commit -m "fix: adjust print stylesheet for guest list"
```

---

### Task 10: Deploy to Vercel

**Files:**
- Create: `vercel.json`

**Interfaces:**
- Consumes: the whole app built in Tasks 1–9; `VITE_APPS_SCRIPT_URL` (Task 6/7) as a Vercel environment variable.

- [ ] **Step 1: Create `vercel.json`**

SPA rewrite so `/lista` resolves to `index.html` instead of 404 on a hard refresh:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Verify the production build locally**

Run: `npm run build`
Expected: completes without errors, creates a `dist/` folder.

Run: `npm run preview`
Open the printed local URL, confirm `/` and `/lista` both still work (same checks as Tasks 3–9). Stop the preview server.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: add Vercel SPA rewrite config"
```

- [ ] **Step 4: Push to GitHub and deploy on Vercel**

This is a manual step done by you (requires your GitHub/Vercel login):

1. Create a new empty GitHub repository (e.g. `cabare-da-lucidea`).
2. `git remote add origin <url-do-repo>` then `git push -u origin master`.
3. On https://vercel.com, click **Add New > Project**, import the GitHub repo.
4. In the project's **Environment Variables** settings, add `VITE_APPS_SCRIPT_URL` with the same value as your local `.env.local` (Task 7).
5. Deploy. Vercel gives you a production URL (e.g. `cabare-da-lucidea.vercel.app`).

- [ ] **Step 5: End-to-end verification on production**

Open the production URL, submit a test RSVP (e.g. "Teste Produção" with one companion), confirm the success message appears and the row lands in the Google Sheet. Then open `<production-url>/lista`, enter the PIN, confirm the test RSVP shows up. Delete the test row from the sheet afterward — the site is now ready for real guests.

---

## Post-plan operational note (not a task — do this on the day of the party)

About 3 hours before the party (target: the morning of 2026-10-17), open `<production-url>/lista`, enter the PIN, review the list, click "Imprimir", and save/print to take to the reception desk at Imperial Recepções e Eventos.
