import { motion, AnimatePresence } from 'motion/react'
import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check, Minus, ArrowUpRight, Calculator, ShieldCheck, WarningCircle, CircleNotch, Play } from '@phosphor-icons/react'
import { Button, EXPO } from '../ui/kit'
import { action, ApiError } from '../data/store'
import { In, Head, Section, card, micro } from './essentiel-sections'
import { PLANS, PLAN_OPTIONS } from '../data/plans'

const SOLO = PLANS.find((p) => p.id === 'solo')!
/** Prix mensuel de Solo, tiré de la grille unique (data/plans.ts). */
export const PRICE = Number(SOLO.price.replace(',', '.'))
const eur = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

/* ——— Grille unique (data/plans.ts) + comparatif ——— */

const INCLUDED = [
  'Brief de rendez-vous préparé la veille',
  'Débrief vocal et compte rendu structuré',
  'Les 9 documents rédigés, à relire et valider',
  'Rappels et relances proposés au bon moment',
  'Import de vos biens et contacts depuis eGO ou Hektor (CSV)',
  'Temps gagné mesuré chaque semaine, corrections comprises',
  'Conformité et veille légale France / Portugal',
]

type Cell = boolean | string
const ROWS: [string, Cell, Cell, Cell][] = [
  ['Dossiers actifs', ...(PLANS.map((p) => p.dossiers.replace(/ dossiers? actifs?/, '')) as [string, string, string])],
  ['Utilisateurs', ...(PLANS.map((p) => p.seats) as [string, string, string])],
  ['Brief de rendez-vous, débrief, compte rendu', true, true, true],
  ['Les 9 documents à relire et valider', true, true, true],
  ['Temps gagné mesuré', true, true, true],
  ['Import CSV eGO / Hektor', true, true, true],
  ['Rappels et relances automatiques', false, true, true],
  ['Conformité et veille légale FR / PT', false, true, true],
  ['Invitations des conseillers, données séparées', false, false, true],
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)
  const year = annual && SOLO.yearly ? SOLO.yearly.split(' € ') : null // « 99 € / an » → ['99', '/ an']
  return (
    <Section id="tarif">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Head kicker="Tarif" title="Gratuit pendant la bêta," accent="simple ensuite." sub="Pendant la bêta, tout est ouvert et gratuit, sans carte bancaire. Ensuite, une seule grille : Découverte, Solo ou Agence, et deux options si vous en avez besoin." />
        <div className="flex shrink-0 self-start rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 md:self-auto">
          {([[false, 'Mensuel'], [true, 'Annuel (Solo)']] as const).map(([v, l]) => (
            <button key={l} onClick={() => setAnnual(v)} aria-pressed={annual === v} className="relative rounded-full px-4 py-2 text-[13px]">
              {annual === v && <motion.span layoutId="ess-billing" className="absolute inset-0 rounded-full bg-bone" transition={{ duration: 0.5, ease: EXPO }} />}
              <span className={clsx('relative', annual === v ? 'text-ink' : 'text-bone/70')}>{l}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Offre Solo */}
        <In className="shell !ring-champagne/30">
          <div className="core flex h-full flex-col bg-gradient-to-b from-champagne/[0.10] to-ink-800 p-7 md:p-9">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-medium">Jaspe {SOLO.name}</span>
              <span className="eyebrow bg-champagne text-ink">Bêta gratuite</span>
            </div>
            <p className="mt-2 text-[13.5px] text-bone/60">{SOLO.pitch} {SOLO.dossiers}, {SOLO.seats.toLowerCase()}.</p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="relative inline-block overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={String(annual)} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="display inline-block text-7xl md:text-8xl">{year ? year[0] : SOLO.price}</motion.span>
                </AnimatePresence>
              </span>
              <span className="text-2xl text-bone/60">€</span>
            </div>
            <div className="text-[13px] text-mist">HT {year ? `${year[1]} · soit ${eur(Number(year[0]) / 12, 2)} € / mois` : `par mois · ou ${SOLO.yearly} · sans engagement`}</div>
            <ul className="mt-8 flex-1 space-y-3">
              {INCLUDED.map((f) => <li key={f} className="flex items-start gap-2.5 text-[14px] text-bone/80"><Check size={15} className="mt-0.5 shrink-0 text-champagne" />{f}</li>)}
            </ul>
            <div className="mt-9"><Button size="lg" href="#essai" className="w-full justify-between">Essayer la bêta gratuite</Button></div>
            <p className="mt-3 text-center text-[11.5px] text-mist">Aucune carte bancaire · tout est ouvert pendant la bêta</p>
          </div>
        </In>

        {/* Comparatif des trois offres */}
        <In delay={0.08} className={clsx(card, 'flex flex-col p-5 md:p-7')}>
          <div className="flex items-center justify-between gap-4">
            <span className={micro}>Comparer les offres</span>
            <a href="/tarifs" className="group flex items-center gap-1 text-[12.5px] text-champagne-300 hover:text-champagne">Détail complet <ArrowUpRight size={13} className="transition-transform duration-500 ease-silk group-hover:-translate-y-px group-hover:translate-x-px" /></a>
          </div>
          <p className="mt-3 text-[11.5px] text-mist sm:hidden">Faites glisser le tableau pour voir les trois offres →</p>
          <div className="-mx-5 mt-5 flex-1 overflow-x-auto px-5 md:-mx-7 md:px-7">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className="w-[34%] pb-4" />
                  {PLANS.map((p) => (
                    <th key={p.id} className={clsx('rounded-t-xl px-3 pb-4 pt-3 align-bottom font-normal', p.id === 'solo' && 'bg-champagne/[0.08]')}>
                      <div className={clsx('text-[13.5px] font-medium', p.id === 'solo' && 'text-champagne-300')}>{p.name}</div>
                      <div className="num mt-1 text-[15px] text-bone">{p.id === 'solo' && year ? `${year[0]} €` : `${p.price} €`}</div>
                      <div className="text-[10.5px] leading-tight text-mist">{p.id === 'solo' && year ? year[1] : p.unit.replace('€ ', '')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([l, ...cells]) => (
                  <tr key={l} className="border-t border-white/[0.06]">
                    <td className="py-3 pr-3 text-bone/75">{l}</td>
                    {cells.map((c, i) => (
                      <td key={i} className={clsx('px-3 py-3', i === 1 && 'bg-champagne/[0.08]')}>
                        {c === true ? <Check size={15} className="text-sage" aria-label="inclus" /> : c === false ? <Minus size={15} className="text-mist/60" aria-label="non inclus" /> : <span className="text-[12px] text-bone/70">{c}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-mist">Prix HT. Options pour Solo ou Agence : {PLAN_OPTIONS.map((o) => `${o.name} ${o.price}`).join(', ')}. Le passage d’une offre à l’autre se fait sans ressaisie.</p>
        </In>
      </div>
    </Section>
  )
}

/* ——— Calculateur de temps gagné ——— */

/** Minutes par tâche, sans → avec Jaspe. Affiché tel quel sous le calculateur. */
export const HYP = {
  prep: { before: 60, after: 20, label: 'Préparation d’un rendez-vous vendeur' },
  doc: { before: 25, after: 8, label: 'Rédaction d’un livrable (relecture comprise)' },
  rel: { before: 4, after: 1, label: 'Relance ou rappel client' },
}

/** Gain mensuel en heures et en euros pour un siège. */
export function roi(rdv: number, docs: number, relances: number, rate: number, cost = PRICE) {
  const parts = {
    prep: (rdv * (HYP.prep.before - HYP.prep.after)) / 60,
    doc: (rdv * docs * (HYP.doc.before - HYP.doc.after)) / 60,
    rel: (relances * (HYP.rel.before - HYP.rel.after)) / 60,
  }
  const hours = parts.prep + parts.doc + parts.rel
  const value = hours * rate
  return { parts, hours, value, net: value - cost, multiple: value / cost }
}

function Slider({ label, value, set, min, max, step = 1, unit }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; unit: string }) {
  const id = `ess-${label.replace(/\W+/g, '-')}`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] text-bone/80">{label}</label>
        <span className="num text-[15px] text-bone">{value}<span className="ml-1 text-[12px] text-mist">{unit}</span></span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-auto accent-[rgb(var(--acc-500))]" />
      <div className="mt-1 flex justify-between num text-[10.5px] text-mist"><span>{min}</span><span>{max}</span></div>
    </div>
  )
}

export function Roi() {
  const [rdv, setRdv] = useState(6)
  const [docs, setDocs] = useState(9)
  const [rel, setRel] = useState(40)
  const [rate, setRate] = useState(45)
  const r = roi(rdv, docs, rel, rate)
  const bars: [string, number][] = [['Préparation', r.parts.prep], ['Livrables', r.parts.doc], ['Relances', r.parts.rel]]
  const h = (n: number) => `${eur(n, 1).replace(/,0$/, '')} h`
  return (
    <Section id="calcul" className="bg-ink-850">
      <Head kicker="Calculateur" title="Combien d’heures" accent="vous rend-il ?" sub="Réglez les curseurs sur votre activité réelle. Le calcul porte sur un siège et un mois." />
      <div className={clsx(card, 'mt-12 grid grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1fr]')}>
        <div className="space-y-7 p-6 md:p-9">
          <Slider label="Rendez-vous vendeurs par mois" value={rdv} set={setRdv} min={1} max={30} unit="RDV" />
          <Slider label="Livrables utilisés par rendez-vous" value={docs} set={setDocs} min={1} max={9} unit="sur 9" />
          <Slider label="Relances et rappels par mois" value={rel} set={setRel} min={0} max={200} step={5} unit="messages" />
          <Slider label="Valeur d’une heure de votre temps" value={rate} set={setRate} min={20} max={120} step={5} unit="€ / h" />
        </div>
        <div className="flex flex-col border-t border-white/[0.06] bg-champagne/[0.05] p-6 md:p-9 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-champagne-300"><Calculator size={16} weight="light" /><span className={micro}>Chaque mois, pour un siège</span></div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div><div className="display text-6xl md:text-7xl" aria-live="polite">{h(r.hours)}</div><div className="mt-1 text-[12.5px] text-mist">gagnées · ≈ {h(r.hours / 4.33)} par semaine</div></div>
            <div><div className="display text-6xl text-champagne-300 md:text-7xl">{eur(r.value)} €</div><div className="mt-1 text-[12.5px] text-mist">de temps valorisé</div></div>
          </div>
          <div className="mt-8 space-y-3">
            {bars.map(([l, v]) => (
              <div key={l}>
                <div className="flex justify-between text-[12.5px]"><span className="text-bone/70">{l}</span><span className="num text-bone/80">{h(v)}</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div className="h-full rounded-full bg-champagne" animate={{ width: `${r.hours ? (v / r.hours) * 100 : 0}%` }} transition={{ duration: 0.5, ease: EXPO }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-ink-800/70 p-4 text-[13.5px] ring-1 ring-white/[0.06]">
            Pour <span className="font-medium text-bone">{SOLO.price} €</span> HT par mois, Jaspe {SOLO.name} vous rend <span className="font-medium text-champagne-300">{eur(r.value)} €</span> de temps,
            soit <span className="font-medium text-bone">×{eur(r.multiple, 0)}</span> son prix{r.net > 0 && <> — <span className="font-medium text-sage">{eur(r.net)} €</span> de gain net</>}.
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-1.5 text-[12px] text-mist md:grid-cols-3">
        <span className="md:col-span-3 mb-1 font-medium text-bone/60">Hypothèses du calcul (temps moyens observés en agence pilote, à vérifier pendant votre essai)</span>
        {Object.values(HYP).map((x) => <span key={x.label}>{x.label} : <span className="num">{x.before} min → {x.after} min</span></span>)}
      </div>
    </Section>
  )
}

/* ——— Formulaire d’essai ——— */

type State = { s: 'idle' } | { s: 'sending' } | { s: 'ok'; name: string; email: string } | { s: 'error'; msg: string }

const FIELDS: { n: string; l: string; t: string; ac: string; req: boolean; ph: string }[] = [
  { n: 'name', l: 'Nom complet', t: 'text', ac: 'name', req: true, ph: 'Prénom Nom' },
  { n: 'email', l: 'E-mail professionnel', t: 'email', ac: 'email', req: true, ph: 'vous@votre-agence.fr' },
  { n: 'org', l: 'Agence', t: 'text', ac: 'organization', req: true, ph: 'Nom et ville de votre agence' },
  { n: 'phone', l: 'Téléphone', t: 'tel', ac: 'tel', req: false, ph: '06 00 00 00 00' },
]

export function Trial() {
  const [st, setSt] = useState<State>({ s: 'idle' })
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries([...new FormData(e.currentTarget)].map(([k, v]) => [k, String(v).trim()]))
    if (!f.name || !f.email || !f.org) return setSt({ s: 'error', msg: 'Nom, e-mail et agence sont requis.' })
    setSt({ s: 'sending' })
    try {
      // ponytail: le serveur ne stocke que name/email/org/size — le téléphone est porté dans « size » pour ne pas être perdu.
      await action('lead.create', { name: f.name, email: f.email, org: f.org, phone: f.phone, size: 'Bêta Jaspe Essentiel' })
      setSt({ s: 'ok', name: f.name.split(' ')[0], email: f.email })
    } catch (x) {
      setSt({ s: 'error', msg: x instanceof ApiError ? x.message : 'Serveur injoignable : rien n’a été transmis. Vérifiez votre connexion et réessayez.' })
    }
  }
  return (
    <Section id="essai">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <Head kicker="Bêta gratuite" title="Testez-le sur" accent="votre prochain rendez-vous." sub="Pendant la bêta, tout est ouvert et gratuit, sans carte bancaire. Nous ouvrons votre espace et vous aidons à importer vos biens et contacts depuis eGO ou Hektor (fichier CSV)." />
          <ul className="mt-8 space-y-3">
            {['Aucune carte bancaire demandée', 'Vos 3 prochains rendez-vous préparés avec vous', 'Export de vos documents à tout moment', 'Hébergement européen prévu à l’ouverture, données jamais revendues'].map((x) => (
              <li key={x} className="flex items-center gap-3 text-[14.5px] text-bone/80"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage/15 text-sage"><Check size={11} weight="bold" /></span>{x}</li>
            ))}
          </ul>
        </div>
        <In className="shell">
          <div className="core p-6 md:p-8">
            <AnimatePresence mode="wait">
              {st.s === 'ok' ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EXPO }} className="py-8 text-center" role="status">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-ink"><Check size={24} /></span>
                  <div className="display mt-6 text-4xl">Merci {st.name}.</div>
                  <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-bone/65">Votre demande est enregistrée. Un conseiller Jaspe vous contacte sous 2 h ouvrées pour ouvrir votre espace — les accès seront adressés à <span className="text-bone">{st.email}</span>.</p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button variant="ghost" href="/essentiel/app" icon={<Play size={14} weight="light" />}>Explorer la démo</Button>
                    <button onClick={() => setSt({ s: 'idle' })} className="rounded-full px-4 py-2 text-[13px] text-bone/60 transition hover:text-bone">Nouvelle demande</button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="f" onSubmit={submit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {FIELDS.map((x) => (
                    <label key={x.n} className="block">
                      <span className="mb-1.5 flex items-baseline justify-between"><span className={micro}>{x.l}{x.req && ' *'}</span>{!x.req && <span className="text-[11px] text-mist">facultatif</span>}</span>
                      <input name={x.n} type={x.t} required={x.req} autoComplete={x.ac} placeholder={x.ph} disabled={st.s === 'sending'}
                        className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-[15px] text-bone outline-none ring-1 ring-white/10 transition placeholder:text-mist/70 focus:ring-champagne/60 disabled:opacity-60" />
                      {x.n === 'phone' && <span className="mt-1.5 block text-[11.5px] text-mist">Renseigné, il vaut accord pour être rappelé au sujet de votre essai — révocable à tout moment.</span>}
                    </label>
                  ))}
                  {st.s === 'error' && (
                    <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral/10 px-3.5 py-2.5 text-[13px] text-coral ring-1 ring-coral/25"><WarningCircle size={16} weight="light" className="mt-0.5 shrink-0" />{st.msg}</p>
                  )}
                  <div className="pt-2">
                    <Button type="submit" size="lg" className={clsx('w-full justify-between', st.s === 'sending' && 'pointer-events-none opacity-80')}
                      icon={st.s === 'sending' ? <CircleNotch size={17} className="animate-spin" /> : undefined}>
                      {st.s === 'sending' ? 'Envoi en cours…' : 'Rejoindre la bêta gratuite'}
                    </Button>
                  </div>
                  <p className="flex items-center gap-2 text-[11.5px] text-mist"><ShieldCheck size={13} weight="light" /> Vos informations servent uniquement à ouvrir votre accès à la bêta.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </In>
      </div>
    </Section>
  )
}
