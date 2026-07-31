import Hero from '../components/Hero'
import LocalFesta from '../components/LocalFesta'
import ConfirmarPresenca from '../components/ConfirmarPresenca'

export default function Home() {
  return (
    <main>
      <Hero />
      <LocalFesta />
      <ConfirmarPresenca />
      <footer className="border-t border-amber-500/10 px-5 py-10 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-400/60">
          Cabaré da Lucidéa · 17.10
        </p>
      </footer>
    </main>
  )
}
