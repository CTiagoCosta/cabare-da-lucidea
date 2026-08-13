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
