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
          <h2 className="font-display text-2xl font-semibold text-gold-gradient mb-2">Presença confirmada! �2</h2>
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
