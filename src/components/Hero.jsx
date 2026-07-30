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
