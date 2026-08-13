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
