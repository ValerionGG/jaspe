import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { marked } from 'marked'
import { X } from '@phosphor-icons/react'
import { PageHeader, Tabs, Stagger } from '../ui'
import { EXPO } from '../../ui/kit'
import bench from '../../content/03-benchmark.md?raw'
import insp from '../../content/01-inspiration.md?raw'
import motionDoc from '../../content/02-motion-benchmark.md?raw'
import ideas from '../../content/04-idees-et-automatisations.md?raw'

const DOCS = { bench: { label: 'Benchmark métier', md: bench }, insp: { label: 'Direction artistique', md: insp }, motion: { label: 'Motion & interactions', md: motionDoc }, ideas: { label: 'Idées & automatisations', md: ideas } }
type Key = keyof typeof DOCS | 'shots'

const SHOTS = ['aw-loam-house.jpg', 'aw-mejuma.jpg', 'aw-sobha-privy.jpg', 'aw-lenval.jpg', 'aw-lev.jpg', 'aw-mrc-boca.png', 'aw-rialto.jpg', 'drb-elyse-phenomenon.webp', 'drb-nixtio-luxury.webp', 'drb-lumios-editorial.webp', 'drb-nixtio-dashboard.webp', 'drb-nexusai-dark.webp', 'drb-onero-crm.webp', 'drb-palco-crm.webp', 'drb-eloria-orbix.webp', 'drb-estateo-outcrowd.webp', 'drb-minhaj-editorial.webp', 'drb-serhii-minimal.webp', 'be-agentic-ai-crm.jpg', 'be-re-platform.jpg', 'be-lunare.png', 'be-blumont.jpg', 'be-jawhara.jpg', 'be-propflow.png', 'be-valuation.png', 'be-re-investment.png', 'lb-vestris.webp', 'lb-chisel.webp', 'lb-flamingo.webp', 'ms-luxury-hero.jpg', 'ms-monolith-hero-stratum.jpg', 'ms-sky-estate.jpg', 'ms-agent-wave.jpg', 'ms-golden-portal.jpg', 'ms-zenith-realty.jpg', 'ms-scroll-landing.jpg', 'ms-interactive-discovery.jpg', 'ms-space-voyage-preloader.jpg', 'site-loamhouse.jpeg', 'site-111w57.jpeg', 'site-aman.jpeg', 'site-feau.jpeg', 'site-barnes.jpeg', 'site-zingraf.jpeg', 'site-theagency.jpeg', 'site-knightfrank.jpeg', 'site-lenval.jpeg', 'site-lev.jpeg', 'site-linear.jpeg', 'site-attio.jpeg', 'site-folk.jpeg', 'site-twenty.jpeg', 'site-clay.jpeg', 'site-arc.jpeg', 'site-vercel.jpeg']
const SRC: Record<string, string> = { aw: 'Awwwards', drb: 'Dribbble', be: 'Behance', lb: 'Land-book', ms: 'MotionSites', site: 'Site de référence' }

export default function Etude() {
  const [k, setK] = useState<Key>('bench')
  const [zoom, setZoom] = useState<string | null>(null)
  const html = useMemo(() => (k === 'shots' ? '' : (marked.parse(DOCS[k].md, { async: false }) as string)), [k])
  return (
    <div>
      <PageHeader kicker="Recherche · octobre 2026" title={<>Étude & <span className="italic text-champagne-300">benchmark</span></>} sub="Concurrence, direction artistique, motion, 398 idées et 100 routines : le socle de décision du produit. Sources publiques datées ; aucun compte concurrent testé." />
      <Stagger className="mb-8"><Tabs id="etude" value={k} onChange={setK} items={[...Object.entries(DOCS).map(([id, d]) => ({ id: id as Key, label: d.label })), ...(import.meta.env.VITE_STATIC === '1' ? [] : [{ id: 'shots' as Key, label: 'Planche d’inspiration', count: SHOTS.length }])]} /></Stagger>
      <AnimatePresence mode="wait">
        <motion.div key={k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }}>
          {k === 'shots' ? (
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
              {SHOTS.map((s) => (
                <button key={s} onClick={() => setZoom(s)} className="group mb-4 block w-full overflow-hidden rounded-2xl bg-white/[0.02] text-left ring-1 ring-white/[0.06] transition hover:ring-champagne/30">
                  <img src={`/research/shots/${s}`} alt={s} loading="lazy" className="w-full transition-transform duration-700 ease-silk group-hover:scale-[1.03]" />
                  <div className="flex items-center justify-between px-3.5 py-2.5 text-[11.5px]"><span className="text-bone/75">{s.replace(/^[a-z]+-/, '').replace(/\.\w+$/, '').replace(/-/g, ' ')}</span><span className="text-mist">{SRC[s.split('-')[0]]}</span></div>
                </button>
              ))}
            </div>
          ) : (
            <article className="prose-nxt mx-auto max-w-[860px] rounded-[1.6rem] bg-ink-800/70 p-6 shadow-bezel ring-1 ring-white/[0.06] md:p-12" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {zoom && (
          <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-6 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(null)}>
            <button aria-label="Fermer" className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-bone"><X size={16} /></button>
            <motion.img initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.5, ease: EXPO }} src={`/research/shots/${zoom}`} alt="" className="max-h-full max-w-full rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
