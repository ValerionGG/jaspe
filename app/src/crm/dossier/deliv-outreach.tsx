// Livrables de communication : L1 remerciement, L2 synthèse équipe, L3 avant-première, L4 réseaux, L5 voisinage.
import { useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { EnvelopeSimple, Phone, CalendarBlank, ChatsCircle, Eye, EyeSlash, PaperPlaneTilt, CheckCircle, XCircle, Heart, ChatCircle, ShareFat, ThumbsUp, BookmarkSimple, Plus, X, Scales, Warning, MapPin } from '@phosphor-icons/react'
import { Avatar } from '../../ui/kit'
import { SoftBtn } from '../ui'
import { StudioDoc, AiBadge } from '../studio-docs'
import { action } from '../../data/store'
import { useContacts, useEvents, useBuyers, useMessages, useConversations, useDocuments } from '../../data/collections'
import { agent, eur, fmt, type Buyer } from '../../data/mock'
import { DelivSection, Paper, Panel, Check, Eyebrow, useBusy, dt, type Ctx } from './deliv-kit'

const evDate = (e: { day: number; start: string }) => { const [h, m] = e.start.split(':').map(Number); return new Date(2026, 9, e.day, h, m) }
const longDate = (d: Date) => d.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/* ——— L1 · Mail de remerciement ——— */
export function L1Section({ ctx }: { ctx: Ctx }) {
  const { d, p, a, j } = ctx
  const [contacts] = useContacts()
  const [events] = useEvents()
  const seller = contacts.find((c) => c.dossiers?.includes(d.id) && c.roles?.includes('vendeur'))
  const next = events.filter((e) => e.dossier === d.id && e.kind !== 'interne').map((e) => ({ e, at: evDate(e) })).filter((x) => x.at.getTime() > Date.now()).sort((x, y) => x.at.getTime() - y.at.getTime())[0]
  const pref = j.discovery.contactPref?.v
  const confirmed = ctx.prefs.L1?.confirmed ?? []
  const items = [
    { id: 'to', label: <>Destinataire exact : <b className="font-medium">{ctx.doc?.to ?? d.seller}</b>{seller && <> · {seller.email}</>}</> },
    { id: 'next', label: next ? <>Date annoncée conforme à l’agenda : {next.e.title.toLowerCase()} — {longDate(next.at)}</> : <>Prochaine étape conforme au dossier : {d.next.toLowerCase()}</> },
    { id: 'promise', label: <>Engagement pris : remise de l’analyse de valeur argumentée (L7) avec ses sources</> },
    { id: 'debrief', label: j.debrief?.validated ? <>Aucun engagement absent du débrief vocal validé ({j.debrief.duration})</> : <>Débrief vocal non validé — relire les engagements</> },
  ]
  const toggle = (id: string, on: boolean) => ctx.setPrefs('L1', { confirmed: on ? [...confirmed, id] : confirmed.filter((x) => x !== id) })
  const left = items.filter((i) => !confirmed.includes(i.id)).length
  return (
    <DelivSection code="L1" ctx={ctx} gate={left ? `${left} engagement${left > 1 ? 's' : ''} à confirmer avant validation` : null}>
      {(doc) => (
        <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Paper><StudioDoc doc={doc} d={d} p={p} a={a} /></Paper>
          <div className="space-y-4">
            <Panel title="Destinataire">
              <div className="flex items-center gap-3">
                <Avatar src={seller?.photo ?? d.sellerPhoto ?? '/img/p-paul.webp'} size={40} />
                <div className="min-w-0"><div className="truncate text-[14px]">{seller?.name ?? d.seller}</div><div className="text-[11.5px] text-mist">{d.seller} · vendeurs décideurs</div></div>
              </div>
              <dl className="mt-3 space-y-1.5 text-[12.5px]">
                <div className="flex items-center gap-2 text-bone/75"><EnvelopeSimple size={14} className="text-mist" />{seller?.email ?? 'Adresse e-mail à compléter'}</div>
                {seller?.phone && <div className="flex items-center gap-2 text-bone/75"><Phone size={14} className="text-mist" />{seller.phone}</div>}
                {pref && <div className="flex items-start gap-2 text-bone/75"><ChatsCircle size={14} className="mt-0.5 shrink-0 text-mist" />Préférence déclarée : {pref}</div>}
              </dl>
            </Panel>
            <Panel title="Engagements à confirmer" action={<span className={clsx('num text-[11px]', left ? 'text-champagne-300' : 'text-sage')}>{items.length - left}/{items.length}</span>}>
              <div className="-mx-2">{items.map((i) => <Check key={i.id} on={confirmed.includes(i.id)} onChange={(v) => toggle(i.id, v)}>{i.label}</Check>)}</div>
              <p className="mt-2 text-[11.5px] text-mist">Le calendrier réel prime sur le texte généré : si une date diffère, modifiez le mail avant de valider.</p>
            </Panel>
            <Panel title="Envoi">
              <div className="flex items-start gap-2.5 text-[12.5px] text-bone/75"><CalendarBlank size={15} className="mt-0.5 shrink-0 text-champagne-300" /><span>Programmé dès validation{pref && /10 ?h/.test(pref) ? ', pas avant 10:00 (préférence vendeur)' : ''}. Copie archivée dans le journal du dossier.</span></div>
            </Panel>
          </div>
        </div>
      )}
    </DelivSection>
  )
}

/* ——— L2 · Synthèse équipe (WhatsApp interne) ——— */
export function L2Section({ ctx }: { ctx: Ctx }) {
  const { d, p, a } = ctx
  const [messages] = useMessages()
  const [convs] = useConversations()
  const { busy, run } = useBusy()
  const ch = convs.find((c) => c.id === 'ch1')
  const inCh = messages.filter((m) => m.conversationId === 'ch1').sort((x, y) => x.at.localeCompare(y.at))
  const posted = [...inCh].reverse().find((m) => m.text.includes(p.title))
  const replies = posted ? inCh.filter((m) => m.at > posted.at && m.author !== posted.author) : []
  const shared = [`${p.title} · ${p.district}`, `${p.surface} m² · ${p.rooms} pièces · DPE ${p.dpe}`, 'Fourchette de valeur indicative', 'Motivation et horizon du vendeur']
  const withheld = ['Nom et coordonnées du vendeur', 'Adresse exacte (numéro)', 'Pièces et diagnostics', 'Prix souhaité par le vendeur']
  return (
    <DelivSection code="L2" ctx={ctx}>
      {(doc) => (
        <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Paper className="p-3 md:p-4"><StudioDoc doc={doc} d={d} p={p} a={a} /></Paper>
          <div className="space-y-4">
            <Panel title={`Canal interne · #${ch?.title ?? 'antibes-vieille-ville'}`}>
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 -space-x-2">{(ch?.participants ?? []).map((id) => <Avatar key={id} src={agent(id).photo} size={28} />)}</div>
                <span className="text-[12px] text-mist">{ch?.participants?.length ?? 0} membres · {ch?.topic ?? 'équipe de l’agence'}</span>
              </div>
              {posted ? (
                <div className="mt-3 rounded-xl bg-sage/10 px-3 py-2.5 text-[12.5px] text-bone/80 ring-1 ring-sage/20">
                  <div className="flex items-center gap-1.5 text-sage"><CheckCircle size={14} weight="fill" />Diffusée le {dt(posted.at)} · {posted.status}</div>
                  <div className="mt-1 text-mist">{replies.length ? `${replies.length} réponse${replies.length > 1 ? 's' : ''} depuis : ${replies.slice(-2).map((r) => r.author.split(' ')[0]).join(', ')}` : 'Pas encore de réponse de l’équipe.'}</div>
                </div>
              ) : <p className="mt-3 text-[12.5px] text-mist">Pas encore diffusée. La synthèse ne quitte jamais l’agence.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <SoftBtn tone={posted ? 'ghost' : 'gold'} icon={<PaperPlaneTilt size={14} />} disabled={!!busy} onClick={() => run('send', () => action('message.send', { conversationId: 'ch1', text: doc.body.join('\n'), attachments: [{ name: `Dossier ${d.ref}`, kind: 'link', ref: `/app/dossiers/${d.id}` }] }), 'Synthèse diffusée à l’équipe')}>{busy === 'send' ? 'Diffusion…' : posted ? 'Rediffuser' : 'Diffuser à l’équipe'}</SoftBtn>
                <Link to="/app/messages?c=ch1" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] text-champagne-300 hover:underline">Ouvrir le canal →</Link>
              </div>
            </Panel>
            <Panel title="Informations partageables">
              <ul className="space-y-1.5 text-[12.5px]">
                {shared.map((s) => <li key={s} className="flex items-center gap-2 text-bone/80"><Eye size={14} className="shrink-0 text-sage" />{s}</li>)}
                {withheld.map((s) => <li key={s} className="flex items-center gap-2 text-mist line-through decoration-white/20"><EyeSlash size={14} className="shrink-0 text-coral" />{s}</li>)}
              </ul>
              <p className="mt-2 text-[11.5px] text-mist">Le lien joint ouvre le dossier selon les droits de chaque membre.</p>
            </Panel>
          </div>
        </div>
      )}
    </DelivSection>
  )
}

/* ——— L3 · Avant-première acquéreurs ——— */
/** Score expliqué, miroir du matching serveur : budget 45 · zone 35 · type 20. */
function scoreOf(b: Buyer, p: Ctx['p']) {
  const budget = p.price >= b.budget[0] * 0.9 && p.price <= b.budget[1] * 1.05
  const zone = b.zones.some((z) => [p.district, p.city].some((x) => x.includes(z) || z.includes(x)))
  const type = !b.type || b.type === p.type || (b.type === 'Maison' && p.type === 'Villa')
  return { budget, zone, type, score: (budget ? 45 : 0) + (zone ? 35 : 0) + (type ? 20 : 0) }
}

export function L3Section({ ctx }: { ctx: Ctx }) {
  const { d, p, a, doc } = ctx
  const [buyers] = useBuyers()
  const [, docOps] = useDocuments()
  const pref = ctx.prefs.L3 ?? {}
  const rows = buyers.map((b) => ({ b, ...scoreOf(b, p) })).sort((x, y) => y.score - x.score)
  const selected = pref.selected ?? doc?.matches?.map((m) => m.id) ?? rows.filter((r) => r.score >= 65).map((r) => r.b.id)
  const set = (patch: Partial<NonNullable<typeof pref>>) => ctx.setPrefs('L3', { ...pref, selected, ...patch })
  const toggle = (id: string) => set({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  const chosen = rows.filter((r) => selected.includes(r.b.id))
  const gate = !chosen.length ? 'Sélectionnez au moins un destinataire' : !pref.sellerOk ? 'Accord du vendeur requis pour présenter le bien' : !pref.consent ? 'Confirmez l’éligibilité de contact des destinataires' : null
  const C = ({ ok, children }: { ok: boolean; children: string }) => <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] ring-1', ok ? 'bg-sage/10 text-sage ring-sage/20' : 'bg-white/[0.03] text-mist ring-white/[0.07]')}>{ok ? <CheckCircle size={10} weight="fill" /> : <XCircle size={10} />}{children}</span>
  return (
    <DelivSection code="L3" ctx={ctx} gate={gate}
      beforeValidate={async () => { if (doc) await docOps.update(doc.id, { to: chosen.map((r) => r.b.name).join(', '), matches: chosen.map((r) => ({ id: r.b.id, name: r.b.name, score: r.score })) }) }}>
      {(document) => (
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><Eyebrow>Acquéreurs du CRM · score expliqué</Eyebrow><span className="text-[12px] text-mist"><span className="num text-bone">{chosen.length}</span> destinataire{chosen.length > 1 ? 's' : ''} sur {rows.length}</span></div>
            <div className="space-y-2">
              {rows.map((r) => {
                const on = selected.includes(r.b.id)
                return (
                  <button key={r.b.id} onClick={() => toggle(r.b.id)} className={clsx('flex w-full flex-col gap-2.5 rounded-2xl p-3.5 text-left ring-1 transition sm:flex-row sm:items-center', on ? 'bg-champagne/[0.06] ring-champagne/30' : 'bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]')}>
                    <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] ring-1', on ? 'bg-champagne text-ink ring-champagne' : 'ring-white/20')}>{on && <CheckCircle size={12} weight="bold" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="text-[13.5px]">{r.b.name}</span><span className={clsx('rounded-full px-2 py-0.5 text-[10.5px]', r.b.financing === 'Validé' ? 'bg-sage/10 text-sage' : r.b.financing === 'En cours' ? 'bg-sea/10 text-sea' : 'bg-coral/10 text-coral')}>Financement {r.b.financing.toLowerCase()}</span></span>
                      <span className="mt-1 block text-[11.5px] text-mist">{eur(r.b.budget[0])} – {eur(r.b.budget[1])} · {r.b.type} ≥ {r.b.surface} m² · {r.b.zones.join(', ')} · {r.b.last}</span>
                      <span className="mt-2 flex flex-wrap gap-1"><C ok={r.budget}>Budget</C><C ok={r.zone}>Zone</C><C ok={r.type}>Type</C></span>
                    </span>
                    <span className="flex items-center gap-2 sm:w-32 sm:justify-end">
                      <span className="h-1 w-20 rounded-full bg-white/10"><span className={clsx('block h-1 rounded-full', r.score >= 65 ? 'bg-champagne' : 'bg-white/25')} style={{ width: `${r.score}%` }} /></span>
                      <span className={clsx('num w-8 text-right text-[13px]', r.score >= 65 ? 'text-champagne-300' : 'text-mist')}>{r.score}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <Panel title="Conditions d’envoi">
              <div className="-mx-2">
                <Check on={!!pref.sellerOk} onChange={(v) => set({ sellerOk: v })}>Le vendeur ({d.seller}) autorise la présentation du bien avant diffusion publique.</Check>
                <Check on={!!pref.consent} onChange={(v) => set({ consent: v })}>Chaque destinataire a demandé à recevoir des biens correspondant à ses critères (base : recherche déclarée, désinscription en pied de mail).</Check>
              </div>
              <p className="mt-2 text-[11.5px] text-mist">Un seul envoi par acquéreur et par bien, toutes agences du réseau confondues.</p>
            </Panel>
          </div>
          <Paper className="mx-auto max-w-2xl p-5 md:p-7"><StudioDoc doc={{ ...document, to: chosen.map((r) => r.b.name).join(', ') || 'Aucun destinataire', matches: chosen.map((r) => ({ id: r.b.id, name: r.b.name, score: r.score })) }} d={d} p={p} a={a} /></Paper>
        </div>
      )}
    </DelivSection>
  )
}

/* ——— L4 · Kit réseaux sociaux ——— */
const NETS = [
  { net: 'Instagram', ratio: 'aspect-square', handle: 'maison.riviera', slot: '2026-10-14T18:30' },
  { net: 'LinkedIn', ratio: 'aspect-[1.91/1]', handle: 'Maison Riviera Immobilier', slot: '2026-10-15T08:30' },
  { net: 'Facebook', ratio: 'aspect-[4/3]', handle: 'Maison Riviera Immobilier', slot: '2026-10-16T12:00' },
]
const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 12 + i))

export function L4Section({ ctx }: { ctx: Ctx }) {
  const { d, p } = ctx
  const pref = ctx.prefs.L4 ?? {}
  const schedule = { ...Object.fromEntries(NETS.map((n) => [n.net, n.slot])), ...pref.schedule }
  const original = pref.original ?? ['LinkedIn', 'Facebook']
  const set = (patch: Partial<NonNullable<typeof pref>>) => ctx.setPrefs('L4', { ...pref, ...patch })
  return (
    <DelivSection code="L4" ctx={ctx}>
      {(doc) => {
        const posts = NETS.map((n, i) => ({ ...n, text: doc.posts?.find((x) => x.network === n.net)?.text ?? '', photo: p.gallery[i % p.gallery.length] ?? p.photo, ai: !original.includes(n.net) }))
        const checks = [
          { ok: posts.some((x) => /DPE/.test(x.text)), t: `Mention DPE ${p.dpe}` },
          { ok: posts.some((x) => /honoraires/i.test(x.text)), t: 'Honoraires indiqués' },
          { ok: true, t: `${posts.filter((x) => x.ai).length}/3 image(s) retouchée(s) IA, toutes étiquetées (AI Act)` },
          { ok: !!d.mandate, t: d.mandate ? `Mandat ${d.mandate.toLowerCase()} signé : publication autorisée` : 'Mandat non signé : démonstration vendeur uniquement' },
        ]
        return (
          <div className="space-y-5">
            <Paper className="p-3 md:p-5">
              <div className="grid gap-3 md:grid-cols-3">
                {posts.map((x) => (
                  <div key={x.net} className="overflow-hidden rounded-xl bg-white font-sans ring-1 ring-ink/[0.07]">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-serif text-[11px] italic text-champagne-300">MR</span>
                      <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[12px] font-medium">{x.handle}</div><div className="text-[10px] text-ink/45">{x.net} · {new Date(schedule[x.net]).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
                    </div>
                    <div className={`relative ${x.ratio} overflow-hidden`}>
                      <img src={x.photo} alt={`${p.title} — ${x.net}`} className="h-full w-full object-cover" style={x.ai ? { filter: 'saturate(1.12) contrast(1.04) brightness(1.04)' } : undefined} />
                      {x.ai ? <AiBadge className="absolute bottom-2 left-2" label="Image retouchée — IA" /> : <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-[3px] text-[10px] text-bone">Photo originale</span>}
                    </div>
                    <p className="px-3 py-2.5 text-[12px] leading-relaxed text-ink/80">{x.text}</p>
                    <div className="flex gap-4 border-t border-ink/[0.06] px-3 py-2 text-ink/45">{x.net === 'Instagram' ? <><Heart size={15} /><ChatCircle size={15} /><PaperPlaneTilt size={15} /><BookmarkSimple size={15} className="ml-auto" /></> : <><ThumbsUp size={15} /><ChatCircle size={15} /><ShareFat size={15} /></>}</div>
                  </div>
                ))}
              </div>
            </Paper>
            <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
              <Panel title="Calendrier de publication">
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEK.map((day) => {
                    const here = posts.filter((x) => new Date(schedule[x.net]).toDateString() === day.toDateString())
                    return (
                      <div key={day.toISOString()} className={clsx('min-h-[64px] rounded-xl p-1.5 ring-1', here.length ? 'bg-champagne/[0.06] ring-champagne/25' : 'bg-white/[0.02] ring-white/[0.05]')}>
                        <div className="text-[10px] uppercase text-mist">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                        <div className="num text-[13px]">{day.getDate()}</div>
                        {here.map((x) => <div key={x.net} className="mt-0.5 truncate rounded bg-champagne/15 px-1 text-[9.5px] text-champagne-300">{({ Instagram: 'IG', LinkedIn: 'LI', Facebook: 'FB' } as Record<string, string>)[x.net]} {schedule[x.net].slice(11)}</div>)}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {posts.map((x) => (
                    <label key={x.net} className="block text-[11px] text-mist">{x.net}
                      <input type="datetime-local" value={schedule[x.net]} min="2026-10-12T10:00" onChange={(e) => e.target.value && set({ schedule: { ...schedule, [x.net]: e.target.value } })} className="mt-1 w-full rounded-lg bg-white/[0.03] px-2 py-1.5 text-[12px] text-bone outline-none ring-1 ring-white/[0.08] focus:ring-champagne/60" />
                    </label>
                  ))}
                </div>
              </Panel>
              <Panel title="Images & conformité">
                <div className="-mx-2">{posts.map((x) => <Check key={x.net} on={x.ai} onChange={(v) => set({ original: v ? original.filter((n) => n !== x.net) : [...original, x.net] })}>{x.net} : version retouchée par IA (étiquette incrustée, original conservé)</Check>)}</div>
                <ul className="mt-3 space-y-1.5 border-t border-white/[0.05] pt-3 text-[12.5px]">
                  {checks.map((c) => <li key={c.t} className="flex items-center gap-2">{c.ok ? <CheckCircle size={14} weight="fill" className="text-sage" /> : <Warning size={14} weight="fill" className="text-champagne-300" />}<span className={c.ok ? 'text-bone/80' : 'text-champagne-300'}>{c.t}</span></li>)}
                </ul>
              </Panel>
            </div>
          </div>
        )
      }}
    </DelivSection>
  )
}

/* ——— L5 · Courrier voisinage ——— */
const EXCL = ['Boîtes « Stop pub »', 'Adresses inscrites au registre d’opposition', 'Clients déjà suivis par l’agence', 'Le vendeur et ses voisins immédiats (discrétion)']
const STREETS: Record<string, string[]> = {
  'Cap d’Antibes': ['Chemin des Nielles', 'Boulevard de la Garoupe', 'Chemin de la Garoupe', 'Avenue Beau-Site'],
  'Juan-les-Pins': ['Boulevard Baudoin', 'Avenue du Grand Pin', 'Boulevard Édouard-Baudoin'],
}

export function L5Section({ ctx }: { ctx: Ctx }) {
  const { d, p, a } = ctx
  const pref = ctx.prefs.L5 ?? {}
  const streets = pref.streets ?? STREETS[p.district] ?? [p.address.replace(/^\d+\s*/, '').replace(/^./, (c) => c.toUpperCase()), `Quartier ${p.district}`]
  const exclusions = pref.exclusions ?? EXCL.slice(0, 3)
  const [vol, setVol] = useState(String(pref.volume ?? 48 * Math.max(1, streets.length - 2)))
  const [street, setStreet] = useState('')
  const set = (patch: Partial<NonNullable<typeof pref>>) => ctx.setPrefs('L5', { ...pref, streets, exclusions, volume: Number(vol) || 0, ...patch })
  const volume = Number(vol) || 0
  return (
    <DelivSection code="L5" ctx={ctx} gate={!volume ? 'Indiquez le volume de distribution' : !streets.length ? 'Définissez au moins une rue' : null}>
      {(doc) => (
        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Paper className="p-3 md:p-6"><div className="mx-auto max-w-[540px]"><StudioDoc doc={doc} d={d} p={p} a={a} /></div><div className="mt-2 text-center font-sans text-[10px] uppercase tracking-eyebrow text-ink/40">Format A4 · recto</div></Paper>
          <div className="space-y-4">
            <Panel title="Zone de diffusion" action={<span className="flex items-center gap-1 text-[11px] text-mist"><MapPin size={12} />{p.district}</span>}>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] text-mist">Volume (boîtes)<input type="number" min={1} value={vol} onChange={(e) => setVol(e.target.value)} onBlur={() => set({ volume })} className="num mt-1 w-full rounded-lg bg-white/[0.03] px-2.5 py-2 text-[14px] text-bone outline-none ring-1 ring-white/[0.08] focus:ring-champagne/60" /></label>
                <label className="block text-[11px] text-mist">Distribution<input type="date" value={pref.date ?? '2026-10-16'} min="2026-10-12" onChange={(e) => e.target.value && set({ date: e.target.value })} className="mt-1 w-full rounded-lg bg-white/[0.03] px-2.5 py-2 text-[13px] text-bone outline-none ring-1 ring-white/[0.08] focus:ring-champagne/60" /></label>
              </div>
              <div className="mt-3 text-[11px] text-mist">Rues ({streets.length})</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {streets.map((s) => <span key={s} className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] py-1 pl-2.5 pr-1 text-[12px] ring-1 ring-white/[0.07]">{s}<button aria-label={`Retirer ${s}`} onClick={() => set({ streets: streets.filter((x) => x !== s) })} className="rounded-full p-0.5 text-mist hover:text-coral"><X size={11} /></button></span>)}
              </div>
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = street.trim(); if (v && !streets.includes(v)) set({ streets: [...streets, v] }); setStreet('') }}>
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ajouter une rue…" className="min-w-0 flex-1 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[12.5px] text-bone outline-none ring-1 ring-white/[0.08] placeholder:text-mist focus:ring-champagne/60" />
                <button type="submit" aria-label="Ajouter la rue" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.08]"><Plus size={13} /></button>
              </form>
              <div className="mt-3 text-[11px] text-mist">Exclusions</div>
              <div className="-mx-2 mt-1">{EXCL.map((x) => <Check key={x} on={exclusions.includes(x)} onChange={(v) => set({ exclusions: v ? [...exclusions, x] : exclusions.filter((y) => y !== x) })}>{x}</Check>)}</div>
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/[0.05] pt-3 text-[12px]"><span className="text-mist">Impression + distribution · tarif imprimeur 0,38 €/u (devis 09/2026)</span><span className="num shrink-0 whitespace-nowrap text-bone">{fmt(Math.round(volume * 0.38))} €</span></div>
            </Panel>
            <div className="rounded-2xl bg-sea/[0.07] p-4 ring-1 ring-sea/20">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-sea"><Scales size={15} />Rappel légal · prospection</div>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-bone/75">
                <li>Démarchage téléphonique sans consentement préalable interdit depuis le 11/08/2026 (loi du 30 juin 2025) : aucun appel de suivi à partir de ce courrier.</li>
                <li>Le courrier postal reste autorisé : mention d’opposition obligatoire, QR code vers le formulaire de consentement (registre).</li>
                <li>Aucune affirmation non prouvée (« forte demande », « acheteurs en attente ») : {/forte demande/i.test(doc.body.join(' ')) ? <span className="text-coral">formule détectée, à corriger</span> : <span className="text-sage">texte conforme</span>}.</li>
              </ul>
              <div className="mt-2 text-[11px] text-mist">Signataire : {a.name} · {a.agency}</div>
            </div>
          </div>
        </div>
      )}
    </DelivSection>
  )
}
