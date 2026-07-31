import { useState, useEffect } from 'react'
import { PARTY_NAME, PARTY_DATE } from '../utils/config'
import { getCountdown } from '../utils/countdown'
import palcoImg from '../assets/palco-cortina.jpg'

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/50 backdrop-blur-sm border border-amber-400/50 rounded-2xl px-4 py-3 min-w-[60px] sm:min-w-[68px] text-center">
        <span className="text-2xl sm:text-3xl font-black tabular-nums text-gold-gradient">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-white/60 mt-2 uppercase tracking-widest">{label}</span>
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
    <section id="inicio" className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <img
        src={palcoImg}
        alt="Palco de cabaré com cortinas de veludo vermelho e luzes douradas"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="bulbs marquee-frame relative mx-auto rounded-[2rem] bg-black/45 px-6 py-10 backdrop-blur-sm sm:px-14 sm:py-14">
          <p className="font-display text-xs tracking-[0.45em] text-amber-300/80">
            VOCÊ ESTÁ CONVIDADO
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-wide text-gold-gradient sm:text-6xl">
            {PARTY_NAME}
          </h1>

          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-amber-400/50" />
            <span className="font-display text-4xl font-bold text-gold-gradient sm:text-5xl">7.5</span>
            <span className="h-px w-10 bg-amber-400/50" />
          </div>

          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            Você faz parte da minha história e com você quero brindar esse momento especial!
          </p>

          <p className="mt-6 font-display text-xs tracking-[0.3em] text-amber-300/70 uppercase">
            Sábado, 17 de outubro · a partir das 13h
          </p>

          {countdown && (
            <div className="mt-8 flex justify-center gap-3 sm:gap-4">
              <CountdownBox value={countdown.days} label="Dias" />
              <CountdownBox value={countdown.hours} label="Horas" />
              <CountdownBox value={countdown.minutes} label="Min" />
              <CountdownBox value={countdown.seconds} label="Seg" />
            </div>
          )}

          <a
            href="#confirmar"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 font-display text-sm tracking-[0.2em] text-black uppercase transition-transform hover:scale-105"
          >
            Confirmar presença
          </a>
        </div>
      </div>
    </section>
  )
}
