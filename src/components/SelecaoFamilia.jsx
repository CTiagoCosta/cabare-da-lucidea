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
