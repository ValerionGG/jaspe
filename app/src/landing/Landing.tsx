import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { Nav, Preloader, Cursor } from './chrome'
import { Hero } from './Hero'
import { HeroLight } from './HeroLight'
import { useTheme } from '../ui/theme'
import { Marquee, Manifesto, Parcours } from './Story'
import { Showcase, Bento, DayRoutines, Network } from './Features'
import { Personas, Pricing, Faq, Cta, Footer } from './Closing'

export default function Landing() {
  const { theme } = useTheme()
  const [ready, setReady] = useState(() => sessionStorage.getItem('nxt-intro') === '1')
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -20 } })
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])
  return (
    <div className="grain bg-ink">
      {!ready && <Preloader onDone={() => { sessionStorage.setItem('nxt-intro', '1'); setReady(true) }} />}
      <Cursor />
      <Nav />
      <main>
        {theme === 'light' ? <HeroLight ready={ready} /> : <Hero ready={ready} />}
        <Marquee />
        <Manifesto />
        <Parcours />
        <Showcase />
        <Bento />
        <DayRoutines />
        <Network />
        <Personas />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
