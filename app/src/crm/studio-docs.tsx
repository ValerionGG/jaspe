import { useState, type ReactNode } from 'react'
import { CheckCircle, Warning, XCircle, Sparkle, Heart, ChatCircle, ShareFat, ThumbsUp, PaperPlaneTilt, BookmarkSimple, ArrowsLeftRight } from '@phosphor-icons/react'
import { eur, type Dossier, type Property, type Agent } from '../data/mock'
import type { StudioDocument } from '../data/studio'

// Rendu « papier » d'un livrable réellement généré (collection documents). Les habillages riches
// (e-mail, messagerie, posts, courrier, avant/après…) ne sont utilisés que si le document porte les champs correspondants.

const Lab = ({ children }: { children: ReactNode }) => <div className="font-sans text-[10px] uppercase tracking-eyebrow text-ink/45">{children}</div>
const Paras = ({ body, className = 'text-[16px]' }: { body: string[]; className?: string }) => <div className={`space-y-4 leading-[1.6] text-ink/85 ${className}`}>{body.map((b, i) => <p key={i} className="whitespace-pre-line">{b}</p>)}</div>
const fr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Badge AI Act posé sur une image retouchée. */
export const AiBadge = ({ className = '', label = 'Image retouchée — IA' }: { className?: string; label?: string }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink/75 px-2 py-[3px] font-sans text-[10px] font-medium text-bone backdrop-blur ${className}`}><Sparkle size={10} weight="fill" className="text-champagne-300" />{label}</span>
)

function Letterhead({ right }: { right: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 pb-4">
      <span className="text-[22px] italic leading-none">Maison Riviera<span className="text-champagne-600">.</span></span>
      <span className="font-sans text-[10px] uppercase tracking-eyebrow text-ink/45">{right}</span>
    </div>
  )
}

const mailOf = (name: string) => `${name.toLowerCase().replace(' ', '.').normalize('NFD').replace(/[̀-ͯ]/g, '')}@maison-riviera.fr`

function Email({ to, subject, children, a }: { to: string; subject?: string; children: ReactNode; a: Agent }) {
  return (
    <div>
      <div className="space-y-1.5 border-b border-ink/10 pb-4 font-sans text-[12.5px]">
        {[['De', `${a.name} · ${mailOf(a.name)}`], ['À', to], ['Objet', subject ?? '—']].map(([k, v]) => (
          <div key={k} className="flex gap-3"><span className="w-12 shrink-0 text-ink/45">{k}</span><span className={k === 'Objet' ? 'font-medium text-ink' : 'text-ink/75'}>{v}</span></div>
        ))}
      </div>
      <div className="space-y-4 pt-6">{children}</div>
      <div className="mt-8 flex items-center gap-3 border-t border-ink/10 pt-4 font-sans">
        <img src={a.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="text-[12px] leading-tight"><div className="font-medium">{a.name}</div><div className="text-ink/50">{a.role} · {a.agency}</div><div className="text-ink/40">Carte T CPI 0605 2026 000 041 · RCP Hiscox</div></div>
      </div>
    </div>
  )
}

function Post({ net, photo, label, children }: { net: string; photo: string; label?: string; children: ReactNode }) {
  const ratio = net === 'Instagram' ? 'aspect-square' : net === 'LinkedIn' ? 'aspect-[1.91/1]' : 'aspect-[4/3]'
  return (
    <div className="overflow-hidden rounded-xl bg-white font-sans ring-1 ring-ink/[0.07]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] italic text-champagne-300" style={{ fontFamily: 'Instrument Serif' }}>MR</span>
        <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[12px] font-medium">{net === 'Instagram' ? 'maison.riviera' : 'Maison Riviera Immobilier'}</div><div className="text-[10px] text-ink/45">{net} · brouillon à valider</div></div>
      </div>
      <div className={`relative ${ratio} overflow-hidden`}>
        <img src={photo} alt="" className="h-full w-full object-cover" />
        {label && <AiBadge className="absolute bottom-2 left-2 max-w-[92%] truncate" label={label} />}
      </div>
      <div className="px-3 py-2.5 text-[12px] leading-relaxed text-ink/80">{children}</div>
      <div className="flex gap-4 border-t border-ink/[0.06] px-3 py-2 text-ink/45">
        {net === 'Instagram' ? <><Heart size={15} /><ChatCircle size={15} /><PaperPlaneTilt size={15} /><BookmarkSimple size={15} className="ml-auto" /></> : <><ThumbsUp size={15} /><ChatCircle size={15} /><ShareFat size={15} /></>}
      </div>
    </div>
  )
}

function BeforeAfter({ photo }: { photo: string }) {
  const [x, setX] = useState(52)
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl font-sans">
      <img src={photo} alt="Photo originale" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'saturate(.25) brightness(.6) contrast(.85) sepia(.3)' }} />
      <img src={photo} alt="Projection retouchée par IA" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 0 0 ${x}%)` }} />
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white" style={{ left: `${x}%` }}>
        <span className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-float"><ArrowsLeftRight size={15} /></span>
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-bone backdrop-blur">Avant · original</span>
      <span className="absolute right-3 top-3 rounded-full bg-champagne px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-ink">Après</span>
      <AiBadge className="absolute bottom-3 right-3" label="Image virtuelle — IA" />
      <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} aria-label="Comparer avant et après" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  )
}

const ICON = { ok: <CheckCircle size={16} weight="fill" className="text-sage-600" />, check: <Warning size={16} weight="fill" className="text-champagne-600" />, missing: <XCircle size={16} weight="fill" className="text-coral" /> }

/** Document réel, habillé selon son type. */
export function StudioDoc({ doc, d, p, a }: { doc: StudioDocument; d: Dossier; p: Property; a: Agent }) {
  const body = doc.body ?? []
  if (doc.kind === 'email') {
    return (
      <Email a={a} to={doc.to ?? d.seller} subject={doc.subject}>
        {doc.code === 'L3' && <div className="relative overflow-hidden rounded-xl"><img src={p.gallery[0] ?? p.photo} alt="" className="aspect-[16/8] w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 font-sans text-[10px] uppercase tracking-eyebrow text-bone backdrop-blur">Avant-première · off-market</span></div>}
        <Paras body={body} />
        {doc.matches && doc.matches.length > 0 && <div className="flex flex-wrap gap-1.5 font-sans">{doc.matches.map((m) => <span key={m.id} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[11px]">{m.name} · <span className="num">{m.score}</span></span>)}</div>}
      </Email>
    )
  }
  if (doc.kind === 'message') {
    return (
      <div className="rounded-xl bg-[#EFE7DA] p-4">
        <div className="mb-4 flex items-center justify-between gap-3 font-sans text-[11px] text-ink/55"><span className="font-medium text-ink">{doc.to ?? 'Équipe agence'} · {a.agency}</span><span>Message interne — jamais envoyé au client</span></div>
        <div className="flex justify-end">
          <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[#DCEBD3] px-4 py-2.5 font-sans text-[13.5px] leading-relaxed text-ink shadow-sm">
            {body.map((b, i) => <p key={i} className={`whitespace-pre-line ${i === 0 ? 'font-medium' : 'mt-1.5'}`}>{b}</p>)}
            <div className="mt-1 text-right text-[10px] text-ink/40">{new Date(doc.editedAt ?? doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
          </div>
        </div>
      </div>
    )
  }
  if (doc.kind === 'social' && doc.posts?.length) {
    const photos = [p.gallery[0] ?? p.photo, p.gallery[1] ?? p.photo, p.gallery[2] ?? p.photo]
    return (
      <div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{doc.posts.map((x, i) => <Post key={x.network} net={x.network} photo={photos[i % 3]} label={x.label}>{x.text}</Post>)}</div>
        {body.length > 0 && <p className="mt-4 font-sans text-[12px] text-ink/60">{body.join(' ')}</p>}
      </div>
    )
  }
  if (doc.kind === 'letter') {
    return (
      <div className="mx-auto max-w-[540px] bg-white p-8 shadow-soft ring-1 ring-ink/[0.06] md:p-10">
        <Letterhead right="Courrier" />
        <div className="mt-6 font-sans text-[11px] text-ink/50">À : {doc.to ?? '—'}</div>
        <div className="mt-1 text-right font-sans text-[11px] text-ink/50">{p.city}, le {fr(doc.editedAt ?? doc.createdAt)}</div>
        <Paras body={body} className="mt-6 text-[14px]" />
        <div className="mt-8 border-t border-ink/10 pt-3 font-sans text-[8.5px] leading-snug text-ink/40">Adresses issues de la zone de diffusion validée, hors registre des oppositions. Aucune donnée personnelle n’est conservée. Carte T CPI 0605 2026 000 041.</div>
      </div>
    )
  }
  if (doc.kind === 'checklist') {
    return (
      <div>
        <Letterhead right={doc.title} />
        {doc.items && <div className="mt-5 space-y-1.5">{doc.items.map((it) => <div key={it.label} className="flex items-center gap-3 rounded-lg px-2 py-2 font-sans text-[13px] odd:bg-ink/[0.025]">{ICON[it.state as keyof typeof ICON] ?? ICON.check}<span className="flex-1">{it.label}</span><span className={`rounded-full px-2 py-0.5 text-[10.5px] ${it.state === 'missing' ? 'bg-coral/15 text-coral' : 'bg-ink/[0.05] text-ink/55'}`}>{it.state === 'missing' ? 'Manquant' : it.state === 'check' ? 'À vérifier' : it.ref}</span></div>)}</div>}
        {body.length > 0 && <blockquote className="mt-5 border-l-2 border-champagne-600 pl-4 text-[15px] italic leading-relaxed text-ink/75">{body.join(' ')}</blockquote>}
      </div>
    )
  }
  // Rapports : estimation (fourchette), avant/après, book de services, briefs D1–D3.
  const [head, ...rest] = body
  return (
    <div>
      <Letterhead right={doc.title} />
      {doc.code === 'L6' && <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-lg"><img src={p.photo} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" /><div className="absolute bottom-4 left-4 text-bone"><div className="font-sans text-[9px] uppercase tracking-eyebrow text-champagne-300">Book de services</div><div className="mt-1 text-[24px] leading-tight">{head}</div></div></div>}
      {doc.code !== 'L6' && head && <div className="mt-5 text-[24px] leading-tight">{head}</div>}
      {doc.range && (() => {
        const [lo, hi] = doc.range, min = lo * 0.88, span = hi * 1.12 - min, pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / span) * 100))}%`
        return (
          <div className="mt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><Lab>Fourchette retenue</Lab><span className="text-[34px] leading-none">{eur(lo)} – {eur(hi)}</span></div>
            <div className="relative mt-4 h-2 rounded-full bg-ink/10"><div className="absolute inset-y-0 rounded-full bg-champagne-600" style={{ left: pos(lo), right: `calc(100% - ${pos(hi)})` }} /><div className="absolute -top-1.5 h-5 w-0.5 bg-ink" style={{ left: pos(p.price) }} /></div>
            <div className="mt-2 flex justify-between font-sans text-[10.5px] text-ink/50"><span>Prix présenté {eur(p.price)}</span><span>{p.surface} m² · DPE {p.dpe}</span></div>
          </div>
        )
      })()}
      {doc.code === 'L8' && <div className="mt-5"><BeforeAfter photo={p.gallery[1] ?? p.photo} /></div>}
      {doc.code === 'L6'
        ? <div className="mt-5 space-y-2.5">{rest.map((t, i) => /^\d\./.test(t) ? <div key={i} className="flex gap-3 font-sans"><span className="num text-[12px] text-champagne-700">0{t[0]}</span><span className="text-[14px] leading-snug">{t.replace(/^\d\.\s*/, '')}</span></div> : <p key={i} className="font-sans text-[12px] text-ink/55">{t}</p>)}</div>
        : <Paras body={rest} className="mt-4 text-[15px]" />}
    </div>
  )
}
