import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import clsx from 'clsx'
import { MagnifyingGlass, Plus, UploadSimple, ShieldCheck, ShieldWarning, GitMerge, Phone, EnvelopeSimple, ChatCircleText, X, Check, Minus, Prohibit, Clock, MapPin, Translate, Sparkle, DownloadSimple, ArrowDownLeft, ArrowUpRight, CalendarBlank, Mailbox, PencilSimple, Trash } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, IconBtn, Empty } from '../ui'
import { Ring, EXPO } from '../../ui/kit'
import { prop, type Dossier } from '../../data/mock'
import { ROLE_L, PARTNER, CHANNELS, PURPOSES, type Contact, type Consent, type Role, type Channel } from '../../data/ops'
import { useContacts, useDossiers } from '../../data/collections'
import type { Doc, Ops } from '../../data/store'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'

type C = Contact & Doc
const phoneStatus = (c: Contact) => {
  if (c.opposition?.what.includes('Bloctel')) return 'blocked' as const
  const k = c.consents?.find((x) => x.ch === 'Téléphone' && x.p === 'Prospection')?.ok
  return k === true ? ('ok' as const) : k === false ? ('blocked' as const) : ('none' as const)
}
const PHONE = { ok: { l: 'Autorisé', c: 'text-sage', I: ShieldCheck }, blocked: { l: 'Opposé', c: 'text-coral', I: Prohibit }, none: { l: 'Sans consentement', c: 'text-bone/45', I: ShieldWarning } }
const scoreColor = (s: number) => (s >= 80 ? 'rgb(var(--sage))' : s >= 50 ? 'rgb(var(--acc-500))' : 'rgb(var(--coral))')
const initials = (n: string) => n.replace(/^(M\.|Mme|Me|Dr\.)\s*/g, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
const CH_ICON = { Téléphone: Phone, SMS: ChatCircleText, Email: EnvelopeSimple, Courrier: Mailbox, RDV: CalendarBlank }
const isPartner = (c: Contact) => c.roles.length > 0 && c.roles.every((r) => PARTNER.includes(r))
const stamp = () => new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const shortDay = () => new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
/** Matrice vide : suivi de dossier = base contractuelle, le reste à recueillir. */
const blankConsents = (): Consent[] => CHANNELS.flatMap((ch) => PURPOSES.map((p) => ({ ch, p, ok: p === 'Suivi de dossier' && ch !== 'SMS' ? true : null, date: p === 'Suivi de dossier' ? '—' : undefined, proof: p === 'Suivi de dossier' && ch !== 'SMS' ? 'Base légale : exécution du mandat' : undefined })))
const consentsOf = (c: Contact) => (c.consents?.length ? c.consents : blankConsents())

function Face({ c, size = 34 }: { c: Contact; size?: number }) {
  return c.photo
    ? <img src={c.photo} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-600 to-ink-700 font-serif italic text-champagne-300 ring-1 ring-white/10" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(c.name) || '?'}</span>
}

export default function Contacts() {
  const [people, ops] = useContacts()
  const [dossiers] = useDossiers()
  const [tab, setTab] = useState<'all' | 'vendeur' | 'acquereur' | 'partner'>('all')
  const [q, setQ] = useState('')
  const [callable, setCallable] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<C | 'new' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const list = people.filter((c) =>
    (tab === 'all' || (tab === 'partner' ? c.roles.some((r) => PARTNER.includes(r)) : c.roles.includes(tab))) &&
    (!callable || phoneStatus(c) === 'ok') &&
    (!q || `${c.name} ${c.org ?? ''} ${c.city} ${c.email}`.toLowerCase().includes(q.toLowerCase())))
  const dups = people.filter((c) => c.dupOf && people.some((x) => x.id === c.dupOf))
  const private_ = people.filter((c) => !isPartner(c))
  const counts = { ok: private_.filter((c) => phoneStatus(c) === 'ok').length, blocked: private_.filter((c) => phoneStatus(c) === 'blocked').length, none: private_.filter((c) => phoneStatus(c) === 'none').length }
  const sel = people.find((c) => c.id === open)

  /** Import CSV minimal : nom;email;téléphone;ville;rôle (en-tête facultatif, séparateur , ou ;). */
  const importCsv = async (f?: File) => {
    if (!f) return
    try {
      const rows = (await f.text()).split(/\r?\n/).map((l) => l.split(/[;,]/).map((s) => s.trim())).filter((r) => r[0] && !/^nom$|^name$/i.test(r[0]))
      if (!rows.length) throw new Error('Aucune ligne exploitable (nom;email;téléphone;ville;rôle)')
      for (const [name, email = '', phone = '', city = '—', role = 'acquereur'] of rows)
        await ops.create({ name, email, phone, city, roles: [(role in ROLE_L ? role : 'acquereur') as Role], dossiers: [], score: 30, last: `${shortDay()} · import`, pref: { ch: 'Email', slot: '—', lang: 'Français' }, consents: blankConsents(), history: [{ d: shortDay(), ch: 'Email', dir: 'in', s: `Import du fichier ${f.name} · aucun consentement de prospection présumé` }] })
      toast(`${rows.length} contact${rows.length > 1 ? 's' : ''} importé${rows.length > 1 ? 's' : ''} · consentements à recueillir`)
    } catch (x) { toast(errText(x), 'error') } finally { if (fileRef.current) fileRef.current.value = '' }
  }

  const merge = async (dup: C, main: C) => {
    try {
      const consents = consentsOf(main).map((k) => (k.ok !== null ? k : consentsOf(dup).find((x) => x.ch === k.ch && x.p === k.p && x.ok !== null) ?? k))
      await ops.update(main.id, {
        dossiers: [...new Set([...main.dossiers, ...dup.dossiers])], history: [...main.history, ...dup.history, { d: shortDay(), ch: 'Email', dir: 'out', s: `Fusion de la fiche « ${dup.name} » (${dup.email || dup.phone}) · preuves conservées` }],
        consents, phone: main.phone || dup.phone, email: main.email || dup.email, opposition: main.opposition ?? dup.opposition,
      })
      await ops.remove(dup.id)
      setOpen(main.id); toast(`« ${dup.name} » fusionné dans « ${main.name} »`)
    } catch (x) { toast(errText(x), 'error') }
  }

  return (
    <div>
      <PageHeader
        kicker={`Annuaire · ${people.length} contacts`}
        title={<>Votre <span className="italic text-champagne-300">cercle</span>, en règle</>}
        sub="Vendeurs, acquéreurs et partenaires au même endroit, avec l’historique des échanges et la preuve de chaque consentement, par canal et par finalité."
        actions={<>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => importCsv(e.target.files?.[0])} />
          <SoftBtn icon={<UploadSimple size={14} weight="light" />} onClick={() => fileRef.current?.click()}>Importer CSV</SoftBtn>
          <SoftBtn tone="gold" icon={<Plus size={14} weight="light" />} onClick={() => setEditing('new')}>Nouveau contact</SoftBtn>
        </>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Stagger className="lg:col-span-8">
          <Card className="h-full">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-eyebrow text-mist"><ShieldCheck size={13} weight="light" className="text-champagne" />Registre des consentements</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-bone/75">Depuis le <span className="num text-bone">11/08/2026</span>, le démarchage téléphonique sans consentement préalable est interdit. Les contacts sans preuve sont <span className="text-champagne-300">retirés automatiquement</span> des listes d’appel.</p>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-2">
                {(['ok', 'none', 'blocked'] as const).map((k) => {
                  const P = PHONE[k]
                  return (
                    <div key={k} className="rounded-2xl bg-white/[0.025] px-4 py-3 text-center ring-1 ring-white/[0.05]">
                      <div className={clsx('display text-[2rem] leading-none', P.c)}>{counts[k]}</div>
                      <div className="mt-1 text-[10.5px] text-mist">{P.l}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </Stagger>
        <Stagger i={1} className="lg:col-span-4">
          <Card className="h-full">
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-eyebrow text-mist"><GitMerge size={13} weight="light" className="text-sea" />Qualité de la base</div>
            <AnimatePresence mode="wait">
              {dups.length ? (
                <motion.div key="d" exit={{ opacity: 0 }}>
                  <p className="mt-2 text-[13.5px] text-bone/75"><span className="num text-bone">{dups.length}</span> doublon{dups.length > 1 ? 's' : ''} probable{dups.length > 1 ? 's' : ''} détecté{dups.length > 1 ? 's' : ''}.</p>
                  <div className="mt-3 space-y-1.5">
                    {dups.map((d) => (
                      <button key={d.id} onClick={() => setOpen(d.dupOf!)} className="flex w-full items-center gap-2 rounded-xl bg-white/[0.025] px-3 py-2 text-left text-[12.5px] ring-1 ring-white/[0.05] transition hover:ring-sea/30">
                        <span className="flex-1 truncate">{d.name} → {people.find((x) => x.id === d.dupOf)!.name}</span><span className="text-[11px] text-sea">Examiner</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-2 text-[13.5px] text-sage"><Check size={15} weight="bold" />Aucun doublon restant.</motion.p>
              )}
            </AnimatePresence>
          </Card>
        </Stagger>
      </div>

      <Stagger i={2} className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs id="ct-tab" value={tab} onChange={setTab} items={[
          { id: 'all', label: 'Tous', count: people.length },
          { id: 'vendeur', label: 'Vendeurs', count: people.filter((c) => c.roles.includes('vendeur')).length },
          { id: 'acquereur', label: 'Acquéreurs', count: people.filter((c) => c.roles.includes('acquereur')).length },
          { id: 'partner', label: 'Partenaires', count: people.filter((c) => c.roles.some((r) => PARTNER.includes(r))).length },
        ]} />
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-2 ring-1 ring-white/[0.07] md:w-64 md:flex-none">
            <MagnifyingGlass size={14} className="text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, ville, email…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-mist" />
          </label>
          <button onClick={() => setCallable(!callable)} className={clsx('flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] ring-1 transition', callable ? 'bg-sage/15 text-sage ring-sage/30' : 'text-bone/70 ring-white/[0.07] hover:text-bone')}>
            <Phone size={13} weight="light" />Appelables
          </button>
        </div>
      </Stagger>

      <Stagger i={3}>
        <Card pad={false}>
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-eyebrow text-mist">
                  {['Contact', 'Rôles', 'Dossiers', 'Préférence', 'Prospection tél.', 'Relation', 'Dernier échange'].map((h) => <th key={h} className="px-4 pb-3 pt-4 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {list.map((c) => {
                    const ps = PHONE[phoneStatus(c)]
                    return (
                      <motion.tr key={c.id} layout exit={{ opacity: 0, transition: { duration: 0.3 } }} onClick={() => setOpen(c.id)} className={clsx('cursor-pointer border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]', open === c.id && 'bg-champagne/[0.04]')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Face c={c} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[13.5px] font-medium">{c.name}{c.dupOf && dups.includes(c) && <span className="flex items-center gap-1 rounded-full bg-sea/10 px-1.5 py-px text-[10px] font-normal text-sea ring-1 ring-sea/25"><GitMerge size={10} />Doublon</span>}</div>
                              <div className="truncate text-[11.5px] text-mist">{c.org || c.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.roles.map((r) => <span key={r} className={clsx('rounded-full px-2 py-px text-[10.5px] ring-1', PARTNER.includes(r) ? 'bg-sea/[0.08] text-sea ring-sea/20' : 'bg-white/[0.04] text-bone/70 ring-white/10')}>{ROLE_L[r]}</span>)}</div></td>
                        <td className="px-4 py-3">
                          <div className="flex -space-x-2">{c.dossiers.slice(0, 3).map((id) => { const d = dossiers.find((x) => x.id === id); return d ? <img key={id} src={prop(d.propertyId).photo} title={d.ref} alt="" className="h-7 w-7 rounded-lg object-cover ring-2 ring-ink-800" /> : null })}{!c.dossiers.length && <span className="text-[11.5px] text-mist">—</span>}</div>
                        </td>
                        <td className="px-4 py-3 text-[12px]"><div>{c.pref.ch}</div><div className="text-[11px] text-mist">{c.pref.slot}</div></td>
                        <td className="px-4 py-3">{isPartner(c) ? <span className="text-[12px] text-mist">Relation pro · B2B</span> : <span className={clsx('flex items-center gap-1.5 text-[12px]', ps.c)}><ps.I size={14} weight="light" />{ps.l}</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5"><div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} /></div><span className="num text-[11.5px] text-bone/70">{c.score}</span></div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-bone/60">{c.last}</td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {!list.length && <div className="p-5"><Empty title="Aucun contact">{people.length ? 'Aucun contact ne correspond à ces filtres.' : 'Créez un contact ou importez un fichier CSV.'}</Empty></div>}
          </div>
        </Card>
      </Stagger>

      <AnimatePresence>
        {sel && <Sheet key={sel.id} c={sel} people={people} dossiers={dossiers} ops={ops} onClose={() => setOpen(null)} onMerge={merge} onOpen={setOpen} onEdit={() => setEditing(sel)} />}
      </AnimatePresence>

      <Modal open={!!editing} onClose={() => setEditing(null)} kicker="Annuaire" width={640} title={editing === 'new' ? <>Nouveau <span className="italic text-champagne-300">contact</span></> : <>Modifier la <span className="italic text-champagne-300">fiche</span></>}>
        {editing && <ContactForm key={editing === 'new' ? 'new' : editing.id} c={editing === 'new' ? undefined : editing} dossiers={dossiers} onCancel={() => setEditing(null)}
          onSave={async (patch) => {
            if (editing === 'new') { const c = await ops.create({ ...patch, score: 50, last: `${shortDay()} · création`, consents: blankConsents(), history: [] }); setOpen(c.id) } else await ops.update(editing.id, patch)
            setEditing(null)
          }} />}
      </Modal>
    </div>
  )
}

function ContactForm({ c, dossiers, onSave, onCancel }: { c?: C; dossiers: Dossier[]; onSave: (p: Partial<Contact>) => Promise<void>; onCancel: () => void }) {
  return (
    <AsyncForm submitLabel={c ? 'Enregistrer' : 'Créer le contact'} success={c ? 'Fiche mise à jour' : 'Contact créé · consentements à recueillir'} onCancel={onCancel} onSubmit={async (v) => {
      const fd = (n: string) => Array.from(document.querySelectorAll<HTMLInputElement>(`[data-ct-form] input[name="${n}"]:checked`)).map((x) => x.value)
      const roles = fd('roles') as Role[]
      if (!v.name.trim()) throw new Error('Nom requis')
      if (!roles.length) throw new Error('Au moins un rôle')
      if (!v.email.trim() && !v.phone.trim()) throw new Error('Email ou téléphone requis')
      if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) throw new Error('Email invalide')
      const score = Number(v.score)
      await onSave({ name: v.name.trim(), org: v.org.trim(), roles, city: v.city.trim() || '—', phone: v.phone.trim(), email: v.email.trim(), dossiers: fd('dossiers'), pref: { ch: v.ch, slot: v.slot.trim() || '—', lang: v.lang.trim() || 'Français', note: v.note.trim() }, ...(c && Number.isFinite(score) ? { score: Math.min(100, Math.max(0, score)) } : {}) })
    }}>
      <div data-ct-form className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet"><Input name="name" required defaultValue={c?.name} placeholder="Hélène Martin" /></Field>
          <Field label="Société / étude"><Input name="org" defaultValue={c?.org} placeholder="Facultatif" /></Field>
          <Field label="Téléphone"><Input name="phone" type="tel" defaultValue={c?.phone} placeholder="+33 6 …" /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={c?.email} /></Field>
          <Field label="Ville"><Input name="city" defaultValue={c?.city} placeholder="Antibes" /></Field>
          {c && <Field label="Score relation (0–100)"><Input name="score" type="number" min={0} max={100} defaultValue={c.score} /></Field>}
        </div>
        <Field label="Rôles">
          <div className="flex flex-wrap gap-2">{(Object.keys(ROLE_L) as Role[]).map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-[12.5px] ring-1 ring-white/[0.08] has-[:checked]:bg-champagne/15 has-[:checked]:text-champagne-300 has-[:checked]:ring-champagne/30">
              <input type="checkbox" name="roles" value={r} defaultChecked={c?.roles.includes(r)} className="accent-[rgb(var(--acc-500))]" />{ROLE_L[r]}
            </label>
          ))}</div>
        </Field>
        <Field label="Dossiers liés">
          <div className="thin-scroll grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">{dossiers.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/[0.02] px-3 py-2 text-[12px] ring-1 ring-white/[0.06] has-[:checked]:ring-champagne/40">
              <input type="checkbox" name="dossiers" value={d.id} defaultChecked={c?.dossiers.includes(d.id)} className="accent-[rgb(var(--acc-500))]" /><span className="truncate">{d.seller} · {d.ref.slice(-4)}</span>
            </label>
          ))}</div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Canal préféré"><Select name="ch" defaultValue={c?.pref.ch ?? 'Email'}>{['Email', 'Téléphone', 'SMS', 'WhatsApp', 'Courrier'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Créneau"><Input name="slot" defaultValue={c?.pref.slot} placeholder="Matin" /></Field>
          <Field label="Langue"><Input name="lang" defaultValue={c?.pref.lang ?? 'Français'} /></Field>
        </div>
        <Field label="Note de contact"><Textarea name="note" rows={2} defaultValue={c?.pref.note} placeholder="Ex. : préfère un récapitulatif écrit après chaque appel" /></Field>
      </div>
    </AsyncForm>
  )
}

function Sheet({ c, people, dossiers, ops, onClose, onMerge, onOpen, onEdit }: { c: C; people: C[]; dossiers: Dossier[]; ops: Ops<C>; onClose: () => void; onMerge: (dup: C, main: C) => Promise<void>; onOpen: (id: string) => void; onEdit: () => void }) {
  const [tab, setTab] = useState<'apercu' | 'echanges' | 'rgpd'>('apercu')
  const [cell, setCell] = useState<{ ch: Channel; p: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [opp, setOpp] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ps = PHONE[phoneStatus(c)]
  const consents = consentsOf(c)
  const dup = people.find((x) => x.dupOf === c.id)
  const main = c.dupOf ? people.find((x) => x.id === c.dupOf) : undefined
  const k = cell && consents.find((x) => x.ch === cell.ch && x.p === cell.p)
  const save = async (patch: Partial<Contact>, ok: string) => { try { await ops.update(c.id, patch); toast(ok) } catch (x) { toast(errText(x), 'error') } }
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `droit-acces-${c.name.replace(/\W+/g, '-').toLowerCase()}.json`; a.click(); URL.revokeObjectURL(url)
    save({ history: [{ d: shortDay(), ch: 'Email', dir: 'out', s: 'Export RGPD (droit d’accès) généré' }, ...c.history] }, 'Export généré · consigné dans l’historique')
  }
  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="thin-scroll h-full w-full max-w-[560px] overflow-y-auto border-l border-white/[0.07] bg-ink-850">
        <div className="relative overflow-hidden p-6 pb-5 md:p-8 md:pb-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-champagne/[0.07] blur-3xl" />
          <div className="relative flex items-start justify-between">
            <Face c={c} size={64} />
            <div className="flex items-center gap-2">
              <div className="mr-1 flex flex-col items-center gap-1"><Ring value={c.score} size={52} color={scoreColor(c.score)}><span className="num text-[12px]">{c.score}</span></Ring><span className="text-[9.5px] uppercase tracking-eyebrow text-mist">Relation</span></div>
              <IconBtn label="Modifier" onClick={onEdit}><PencilSimple size={14} weight="light" /></IconBtn>
              <IconBtn label={confirm ? 'Confirmer la suppression' : 'Supprimer'} active={confirm} onClick={() => (confirm ? ops.remove(c.id).then(() => { toast(`« ${c.name} » supprimé`); onClose() }) : setConfirm(true))}><Trash size={14} weight="light" className={confirm ? 'text-coral' : ''} /></IconBtn>
              <IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn>
            </div>
          </div>
          {confirm && <div className="relative mt-2 text-right text-[11px] text-coral">Suppression définitive · cliquez à nouveau · <button className="underline" onClick={() => setConfirm(false)}>annuler</button></div>}
          <h2 className="display relative mt-4 text-[2.4rem]">{c.name}</h2>
          <div className="relative mt-1 text-[12.5px] text-mist">{c.org ? `${c.org} · ` : ''}{c.city}</div>
          <div className="relative mt-3 flex flex-wrap gap-1.5">{c.roles.map((r) => <span key={r} className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-bone/80 ring-1 ring-white/10">{ROLE_L[r]}</span>)}</div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {c.phone && <a href={`tel:${c.phone.replace(/\s/g, '')}`}><SoftBtn icon={<Phone size={14} weight="light" />}>Appeler</SoftBtn></a>}
            {c.email && <a href={`mailto:${c.email}`}><SoftBtn icon={<EnvelopeSimple size={14} weight="light" />}>Écrire</SoftBtn></a>}
            <SoftBtn icon={<Plus size={14} weight="light" />} onClick={() => { setTab('echanges'); setAdding(true) }}>Consigner un échange</SoftBtn>
          </div>
          <div className={clsx('relative mt-3 flex items-center gap-1.5 text-[11.5px]', ps.c)}><ps.I size={13} weight="light" />Prospection téléphonique : {ps.l.toLowerCase()}{phoneStatus(c) !== 'ok' && ' · appels limités au suivi de dossier'}</div>
        </div>

        <div className="sticky top-0 z-10 border-y border-white/[0.06] bg-ink-850/90 px-6 py-3 backdrop-blur md:px-8">
          <Tabs id="ct-sheet" value={tab} onChange={setTab} items={[{ id: 'apercu', label: 'Aperçu' }, { id: 'echanges', label: 'Échanges', count: c.history.length }, { id: 'rgpd', label: 'Consentements' }]} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: EXPO }} className="space-y-6 p-6 md:p-8">
            {tab === 'apercu' && <>
              {(dup || main) && (
                <div className="rounded-2xl bg-sea/[0.07] p-4 ring-1 ring-sea/20">
                  <div className="flex items-center gap-2 text-[12.5px] text-sea"><GitMerge size={15} weight="light" />{dup ? `Doublon probable : « ${dup.name} »` : `Doublon probable de « ${main!.name} »`}</div>
                  <div className="mt-1 text-[12px] text-bone/60">{(dup ?? c).dupWhy ?? 'Coordonnées proches'} · l’historique et les preuves de consentement sont conservés à la fusion, puis le doublon est supprimé.</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dup ? <button onClick={() => onMerge(dup, c)} className="rounded-full bg-sea/20 px-3.5 py-1.5 text-[12px] text-bone ring-1 ring-sea/30 hover:bg-sea/30">Fusionner dans cette fiche</button>
                      : <button onClick={() => onMerge(c, main!)} className="rounded-full bg-sea/20 px-3.5 py-1.5 text-[12px] text-bone ring-1 ring-sea/30 hover:bg-sea/30">Fusionner dans « {main!.name} »</button>}
                    <button onClick={() => { const x = dup ?? c; ops.update(x.id, { dupOf: null, dupWhy: null } as never).then(() => toast('Marqué comme distinct'), (e) => toast(errText(e), 'error')) }} className="rounded-full px-3.5 py-1.5 text-[12px] text-bone/60 ring-1 ring-white/10 hover:text-bone">Ce n’est pas un doublon</button>
                    {main && <button onClick={() => onOpen(main.id)} className="rounded-full px-3.5 py-1.5 text-[12px] text-sea hover:underline">Voir la fiche principale</button>}
                  </div>
                </div>
              )}
              <section>
                <div className="mb-2.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Coordonnées</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([[Phone, c.phone], [EnvelopeSimple, c.email]] as const).map(([Ic, v], i) => <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/[0.025] px-3 py-2.5 text-[12.5px] ring-1 ring-white/[0.05]"><Ic size={14} weight="light" className="text-mist" /><span className="num truncate">{v || '—'}</span></div>)}
                </div>
              </section>
              <section>
                <div className="mb-2.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Préférences de contact</div>
                <div className="grid grid-cols-3 gap-2">
                  {([[ChatCircleText, 'Canal', c.pref.ch], [Clock, 'Créneau', c.pref.slot], [Translate, 'Langue', c.pref.lang]] as const).map(([Ic, l, v]) => (
                    <div key={l} className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]"><Ic size={14} weight="light" className="text-champagne" /><div className="mt-2 text-[10.5px] text-mist">{l}</div><div className="text-[12.5px]">{v}</div></div>
                  ))}
                </div>
                {c.pref.note && <div className="mt-2 flex items-start gap-2 rounded-xl bg-champagne/[0.06] p-3 text-[12.5px] text-bone/80 ring-1 ring-champagne/15"><Sparkle size={13} weight="fill" className="mt-0.5 shrink-0 text-champagne" />{c.pref.note}</div>}
              </section>
              <section>
                <div className="mb-2.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Dossiers liés</div>
                {c.dossiers.length ? (
                  <div className="space-y-2">
                    {c.dossiers.map((id) => { const d = dossiers.find((x) => x.id === id); if (!d) return null; const p = prop(d.propertyId); return (
                      <Link key={id} to={`/app/dossiers/${id}`} className="group flex items-center gap-3 rounded-2xl bg-white/[0.025] p-2.5 ring-1 ring-white/[0.05] transition hover:ring-champagne/30">
                        <img src={p.photo} alt="" className="h-12 w-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1"><div className="truncate text-[13px]">{p.title}</div><div className="flex items-center gap-1 text-[11px] text-mist"><MapPin size={10} />{p.district} · {d.ref}</div></div>
                        <span className="hidden pr-2 text-[11px] text-mist group-hover:text-champagne-300 sm:block">{d.next}</span>
                      </Link>
                    ) })}
                  </div>
                ) : <div className="text-[12.5px] text-mist">Aucun dossier actif.</div>}
              </section>
            </>}

            {tab === 'echanges' && <>
              {adding ? (
                <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                  <AsyncForm submitLabel="Consigner" success="Échange consigné" onCancel={() => setAdding(false)} onSubmit={async (v) => {
                    if (!v.s.trim()) throw new Error('Résumé requis')
                    const d = v.d ? new Date(v.d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : shortDay()
                    await ops.update(c.id, { history: [{ d, ch: v.ch as Channel | 'RDV', dir: v.dir as 'in' | 'out', s: v.s.trim() }, ...c.history], last: `${d} · ${v.ch === 'RDV' ? 'RDV' : v.ch.toLowerCase()}` })
                    setAdding(false)
                  }}>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Date"><Input name="d" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                      <Field label="Canal"><Select name="ch" defaultValue="Téléphone">{[...CHANNELS, 'RDV'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                      <Field label="Sens"><Select name="dir" defaultValue="out"><option value="out">Émis</option><option value="in">Reçu</option></Select></Field>
                    </div>
                    <Field label="Résumé factuel"><Textarea name="s" rows={3} required placeholder="Ce qui a été dit ou envoyé, sans interprétation" /></Field>
                  </AsyncForm>
                </div>
              ) : <SoftBtn icon={<Plus size={14} weight="light" />} onClick={() => setAdding(true)}>Consigner un échange</SoftBtn>}
              {c.history.length ? (
                <div className="relative">
                  <span className="absolute bottom-2 left-[15px] top-2 w-px bg-white/[0.07]" />
                  {c.history.map((h, i) => { const Ic = CH_ICON[h.ch] ?? ChatCircleText; return (
                    <motion.div key={`${i}-${h.s}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: EXPO }} className="relative flex gap-4 pb-5">
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-bone/70 ring-1 ring-white/10"><Ic size={14} weight="light" /></span>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-center gap-2 text-[11px] text-mist"><span className="num">{h.d}</span>· {h.ch} {h.dir === 'in' ? <ArrowDownLeft size={11} className="text-sea" /> : <ArrowUpRight size={11} className="text-champagne" />}{h.dir === 'in' ? 'reçu' : 'émis'}</div>
                        <div className="mt-1 text-[13px] leading-relaxed text-bone/85">{h.s}</div>
                      </div>
                    </motion.div>
                  ) })}
                </div>
              ) : <Empty title="Aucun échange">Consignez le premier appel, email ou rendez-vous.</Empty>}
            </>}

            {tab === 'rgpd' && <>
              <section>
                <div className="mb-3 flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Consentements par canal et finalité</span><span className="text-[10.5px] text-mist">Cliquer pour modifier</span></div>
                <div className="thin-scroll overflow-x-auto rounded-2xl ring-1 ring-white/[0.06]">
                  <table className="w-full min-w-[440px] text-[12px]">
                    <thead><tr className="bg-white/[0.02]"><th className="px-3 py-2.5 text-left font-normal text-mist" />{CHANNELS.map((ch) => <th key={ch} className="px-2 py-2.5 text-center font-normal text-mist">{ch}</th>)}</tr></thead>
                    <tbody>
                      {PURPOSES.map((p) => (
                        <tr key={p} className="border-t border-white/[0.05]">
                          <td className="px-3 py-2.5 text-bone/75">{p}</td>
                          {CHANNELS.map((ch) => {
                            const x = consents.find((y) => y.ch === ch && y.p === p), on = cell?.ch === ch && cell.p === p
                            return (
                              <td key={ch} className="px-2 py-1.5 text-center">
                                <button onClick={() => setCell(on ? null : { ch, p })} aria-label={`${ch} · ${p}`} className={clsx('mx-auto flex h-7 w-7 items-center justify-center rounded-full ring-1 transition', x?.ok === true ? 'bg-sage/15 text-sage ring-sage/25' : x?.ok === false ? 'bg-coral/15 text-coral ring-coral/25' : 'text-bone/25 ring-white/[0.06] hover:ring-white/20', on && '!ring-2 !ring-bone/60')}>
                                  {x?.ok === true ? <Check size={13} weight="bold" /> : x?.ok === false ? <X size={12} weight="bold" /> : <Minus size={12} />}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AnimatePresence mode="wait">
                  {cell && (
                    <motion.div key={cell.ch + cell.p} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="overflow-hidden">
                      <div className="mt-3 rounded-2xl bg-white/[0.025] p-4 ring-1 ring-white/[0.06]">
                        <div className="mb-3 flex items-center justify-between text-[12px]"><span className="text-bone/85">{cell.ch} · {cell.p}</span><span className="num text-[11px] text-mist">Actuel : {k?.ok ? 'accordé' : k?.ok === false ? 'refusé' : 'non recueilli'}{k?.date && k.date !== '—' ? ` · ${k.date}` : ''}</span></div>
                        <AsyncForm submitLabel="Enregistrer la preuve" success="Consentement horodaté et enregistré" onSubmit={async (v) => {
                          const ok = v.ok === 'yes' ? true : v.ok === 'no' ? false : null
                          if (ok !== null && !v.proof.trim()) throw new Error('Preuve requise : source, document ou enregistrement')
                          const next = { ch: cell.ch, p: cell.p, ok, date: ok === null ? undefined : stamp(), proof: v.proof.trim() || undefined } as Consent
                          await ops.update(c.id, { consents: consents.some((y) => y.ch === cell.ch && y.p === cell.p) ? consents.map((y) => (y.ch === cell.ch && y.p === cell.p ? next : y)) : [...consents, next] })
                          setCell(null)
                        }}>
                          <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                            <Field label="Statut"><Select name="ok" defaultValue={k?.ok === true ? 'yes' : k?.ok === false ? 'no' : 'none'}><option value="yes">Accordé</option><option value="no">Refusé</option><option value="none">Non recueilli</option></Select></Field>
                            <Field label="Preuve" hint="Horodatée automatiquement à l’enregistrement."><Input name="proof" defaultValue={k?.proof} placeholder="Double opt-in · formulaire du 12/10 · enregistrement oral 0:42" /></Field>
                          </div>
                        </AsyncForm>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
              <section>
                <div className="mb-2.5 flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Opposition</span>{!c.opposition && !opp && <button onClick={() => setOpp(true)} className="text-[11.5px] text-coral hover:underline">Enregistrer une opposition</button>}</div>
                {c.opposition ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-coral/[0.07] p-3.5 text-[12.5px] ring-1 ring-coral/20">
                    <Prohibit size={18} weight="light" className="shrink-0 text-coral" />
                    <div className="min-w-0 flex-1"><div className="text-bone/85">{c.opposition.what}</div><div className="num text-[11px] text-mist">Enregistrée le {c.opposition.date} · respectée dans toutes les routines</div></div>
                    <button onClick={() => save({ opposition: null } as never, 'Opposition levée · consigné')} className="shrink-0 rounded-full px-2.5 py-1 text-[11px] text-bone/60 ring-1 ring-white/10 hover:text-bone">Lever</button>
                  </div>
                ) : opp ? (
                  <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                    <AsyncForm submitLabel="Enregistrer l’opposition" success="Opposition enregistrée · prospection bloquée" onCancel={() => setOpp(false)} onSubmit={async (v) => {
                      if (!v.what.trim()) throw new Error('Objet de l’opposition requis')
                      const ch = v.ch as Channel | 'Tous'
                      await ops.update(c.id, { opposition: { what: v.what.trim(), date: stamp() }, consents: consents.map((y) => (y.p !== 'Suivi de dossier' && (ch === 'Tous' || y.ch === ch) ? { ...y, ok: false, date: stamp(), proof: `Opposition : ${v.what.trim()}` } : y)) })
                      setOpp(false)
                    }}>
                      <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                        <Field label="Canal"><Select name="ch" defaultValue="Téléphone">{['Tous', ...CHANNELS].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                        <Field label="Objet"><Input name="what" required placeholder="Inscrit Bloctel · démarchage téléphonique" /></Field>
                      </div>
                    </AsyncForm>
                  </div>
                ) : <div className="flex items-center gap-2 text-[12.5px] text-bone/60"><Check size={14} className="text-sage" />Aucune opposition enregistrée</div>}
              </section>
              <div className="flex flex-wrap gap-2">
                <SoftBtn icon={<DownloadSimple size={14} weight="light" />} onClick={exportJson}>Exporter (droit d’accès)</SoftBtn>
              </div>
            </>}
          </motion.div>
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  )
}
