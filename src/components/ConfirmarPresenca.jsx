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
