import { VENUE_NAME, VENUE_ADDRESS } from '../utils/config'

const detalhes = [
  { rotulo: 'Data', valor: 'Sábado, 17 de Outubro' },
  { rotulo: 'Horário', valor: 'A partir das 13h' },
  { rotulo: 'Local', valor: VENUE_NAME },
  { rotulo: 'Endereço', valor: VENUE_ADDRESS },
]

function Divisor() {
  return (
    <div className="mx-auto flex max-w-xs items-center gap-3 py-8 text-amber-400/70">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/60" />
      <span className="text-xs tracking-[0.4em]">✦</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/60" />
    </div>
  )
}

export default function LocalFesta() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`)}`

  return (
    <section id="local" className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h2 className="font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">
        Um dia de festa
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
        Como legítimo cabaré, o dia promete ser dançante, com muita música boa, muitos drinks e muita alegria.
      </p>

      <Divisor />

      <dl className="grid gap-4 sm:grid-cols-2">
        {detalhes.map((item) => (
          <div
            key={item.rotulo}
            className="rounded-xl border border-amber-500/20 bg-white/5 px-6 py-7 text-left transition-colors hover:border-amber-400/60"
          >
            <dt className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-amber-400/70">
              {item.rotulo}
            </dt>
            <dd className="mt-2 font-display text-lg text-white sm:text-xl">{item.valor}</dd>
          </div>
        ))}
      </dl>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-10 inline-block rounded-full bg-amber-500 px-8 py-3 font-display text-sm tracking-[0.15em] text-black uppercase transition-transform hover:scale-105"
      >
        Ver no mapa
      </a>
    </section>
  )
}
