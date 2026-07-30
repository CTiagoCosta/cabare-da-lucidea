import { VENUE_NAME, VENUE_ADDRESS } from '../utils/config'

export default function LocalFesta() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`)}`

  return (
    <section id="local" className="py-20 px-6 bg-black">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold text-amber-400 mb-8">Onde vai ser</h2>
        <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-8">
          <p className="text-xl font-semibold text-white mb-2">{VENUE_NAME}</p>
          <p className="text-white/70 mb-6">{VENUE_ADDRESS}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-full transition-all"
          >
            Ver no mapa
          </a>
        </div>
      </div>
    </section>
  )
}
