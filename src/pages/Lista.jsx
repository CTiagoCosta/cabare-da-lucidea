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
