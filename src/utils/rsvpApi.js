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
