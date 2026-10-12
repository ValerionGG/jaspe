// Onglet « Modèles » : CRUD, catégories, statut d’approbation Meta (simulé), compteur d’usage, aperçu avec variables.
import { useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Plus, PencilSimple, Copy, Trash, SealCheck, HourglassMedium, MagnifyingGlass } from '@phosphor-icons/react'
import { Card, Stat, Stagger, SoftBtn, Empty } from '../ui'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'
import { useTemplates } from '../../data/collections'
import type { Channel, Template } from '../../data/messaging'
import { CH, ChannelBadge, fill, VARS, eyebrow, me } from './shared'

type T = Template & { id: string }
const SAMPLE: Record<string, string> = { prenom: 'Hélène', date: 'mercredi 14 octobre', heure: '15 h 00', lieu: '14 chemin des Nielles, Antibes', bien: 'villa contemporaine vue mer', conseiller: me.name, pieces: 'le PV d’AG 2025 et le carnet d’entretien' }

function Preview({ body }: { body: string }) {
  return <p className="whitespace-pre-line text-[13px] leading-relaxed text-bone/85">{body.split(/(\{\{\w+\}\})/g).map((p, i) => { const k = /^\{\{(\w+)\}\}$/.exec(p)?.[1]; return k ? <span key={i} className={clsx('rounded px-0.5', SAMPLE[k] ? 'bg-champagne/15 text-champagne-300' : 'bg-coral/15 text-coral')}>{SAMPLE[k] ?? p}</span> : p })}</p>
}

export default function Templates() {
  const [templates, ops] = useTemplates()
  const [cat, setCat] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<T | 'new' | null>(null)
  const cats = [...new Set(templates.map((t) => t.category))].sort()
  const list = (templates as T[]).filter((t) => (!cat || t.category === cat) && (!q || `${t.name} ${t.body}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0))
  const uses = templates.reduce((n, t) => n + (t.uses ?? 0), 0)
  const pending = templates.filter((t) => t.channel === 'whatsapp' && !t.approved).length

  const approve = async (t: T) => { try { await ops.update(t.id, { approved: true }); toast(`« ${t.name} » approuvé par Meta (simulation)`) } catch (e) { toast(errText(e), 'error') } }
  const dup = async (t: T) => { try { await ops.create({ name: `${t.name} (copie)`, channel: t.channel, category: t.category, body: t.body, approved: t.channel !== 'whatsapp', uses: 0 }); toast('Modèle dupliqué' + (t.channel === 'whatsapp' ? ' — à soumettre à Meta' : '')) } catch (e) { toast(errText(e), 'error') } }
  const del = async (t: T) => { if (!window.confirm(`Supprimer le modèle « ${t.name} » ?`)) return; try { await ops.remove(t.id); toast('Modèle supprimé') } catch (e) { toast(errText(e), 'error') } }

  return (
    <div className="space-y-5">
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Modèles" value={templates.length} hint={`${cats.length} catégories`} />
        <Stat label="Approuvés Meta" value={templates.filter((t) => t.channel === 'whatsapp' && t.approved).length} hint="Utilisables hors fenêtre 24 h" />
        <Stat label="En revue" value={pending} hint="Soumission simulée" />
        <Stat label="Utilisations" value={uses} hint="Compteur mis à jour à chaque envoi" />
      </Stagger>
      <Stagger i={1} className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="scrollbar-none flex flex-1 gap-1.5 overflow-x-auto">
          {[null, ...cats].map((c) => <button key={c ?? 'all'} onClick={() => setCat(c)} className={clsx('shrink-0 rounded-full px-3 py-1.5 text-[12px] ring-1 transition', cat === c ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/65 ring-white/[0.07] hover:text-bone')}>{c ?? 'Toutes'} <span className="num text-mist">{c ? templates.filter((t) => t.category === c).length : templates.length}</span></button>)}
        </div>
        <label className="flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.07] md:w-64"><MagnifyingGlass size={14} className="text-mist" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un modèle…" className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-mist" /></label>
        <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setEdit('new')}>Nouveau modèle</SoftBtn>
      </Stagger>
      <Stagger i={2}>
        {list.length === 0 ? <Empty title="Aucun modèle">Créez un modèle ou modifiez les filtres.</Empty> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((t) => (
              <Card key={t.id} className="flex flex-col" pad={false}>
                <div className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1"><div className={eyebrow}>{t.category}</div><div className="mt-0.5 truncate text-[14.5px] font-medium">{t.name}</div></div>
                    <ChannelBadge ch={t.channel} size="xs" />
                  </div>
                  <div className="mt-3 flex-1 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]"><Preview body={t.body} /></div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    {t.channel === 'whatsapp'
                      ? t.approved ? <span className="inline-flex items-center gap-1 text-sage"><SealCheck size={13} weight="fill" />Approuvé Meta</span>
                        : <button onClick={() => approve(t)} title="Simuler la décision de Meta" className="inline-flex items-center gap-1 rounded-full bg-champagne/10 px-2 py-0.5 text-champagne-300 ring-1 ring-champagne/25 hover:bg-champagne/15"><HourglassMedium size={12} />En revue Meta · simuler l’approbation</button>
                      : <span className="inline-flex items-center gap-1 text-bone/55"><SealCheck size={13} />Validé conformité</span>}
                    <span className="num text-mist">{t.uses ?? 0} utilisation{(t.uses ?? 0) > 1 ? 's' : ''}</span>
                    <span className="ml-auto flex gap-0.5">
                      <IBtn label="Modifier" onClick={() => setEdit(t)}><PencilSimple size={14} /></IBtn>
                      <IBtn label="Dupliquer" onClick={() => dup(t)}><Copy size={14} /></IBtn>
                      <IBtn label="Supprimer" onClick={() => del(t)}><Trash size={14} /></IBtn>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stagger>
      <Editor key={edit === 'new' ? 'new' : edit?.id ?? 'none'} tpl={edit} onClose={() => setEdit(null)} cats={cats} />
    </div>
  )
}

const IBtn = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) =>
  <button aria-label={label} title={label} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-full text-bone/60 transition hover:bg-white/[0.06] hover:text-bone">{children}</button>

function Editor({ tpl, onClose, cats }: { tpl: T | 'new' | null; onClose: () => void; cats: string[] }) {
  const [, ops] = useTemplates()
  const t = tpl && tpl !== 'new' ? tpl : undefined
  const [body, setBody] = useState(t?.body ?? 'Bonjour {{prenom}}, ')
  const [channel, setChannel] = useState<Channel>(t?.channel ?? 'whatsapp')
  const ta = useRef<HTMLTextAreaElement>(null)
  const insert = (v: string) => {
    const el = ta.current, tok = `{{${v}}}`
    if (!el) return setBody(body + tok)
    const s = el.selectionStart, e = el.selectionEnd
    setBody(body.slice(0, s) + tok + body.slice(e))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + tok.length, s + tok.length) })
  }
  const changed = t && (t.body !== body || t.channel !== channel)
  return (
    <Modal open={!!tpl} onClose={onClose} title={t ? 'Modifier le modèle' : 'Nouveau modèle'} kicker="Messagerie · modèles" width={760}>
      <AsyncForm submitLabel={t ? 'Enregistrer' : 'Créer le modèle'} onCancel={onClose} onSubmit={async (v) => {
        if (!v.name.trim() || !body.trim()) throw new Error('Nom et texte obligatoires')
        const category = (v.newCat?.trim() || v.category || 'Divers')
        // Toute modification d’un modèle WhatsApp le renvoie en revue Meta (simulation).
        const approved = channel !== 'whatsapp' ? true : t ? (changed ? false : t.approved) : false
        if (t) await ops.update(t.id, { name: v.name.trim(), category, channel, body, approved })
        else await ops.create({ name: v.name.trim(), category, channel, body, approved, uses: 0 })
        toast(channel === 'whatsapp' && !approved ? 'Modèle enregistré — soumis à Meta (en revue)' : 'Modèle enregistré')
        onClose()
      }}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nom" className="sm:col-span-3"><Input name="name" required defaultValue={t?.name} placeholder="Ex. Relance après offre" /></Field>
          <Field label="Canal"><Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>{(['whatsapp', 'email', 'sms', 'portal'] as Channel[]).map((c) => <option key={c} value={c}>{CH[c].label}</option>)}</Select></Field>
          <Field label="Catégorie"><Select name="category" defaultValue={t?.category ?? cats[0]}>{cats.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Ou nouvelle catégorie"><Input name="newCat" placeholder="Facultatif" /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Texte">
            <textarea ref={ta} rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="w-full resize-y rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[14px] leading-relaxed text-bone outline-none ring-1 ring-white/[0.08] transition focus:ring-champagne/60" />
            <div className="mt-2 flex flex-wrap gap-1">{VARS.map((v) => <button type="button" key={v} onClick={() => insert(v)} className="num rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-champagne-300 ring-1 ring-white/[0.08] hover:bg-white/[0.08]">{`{{${v}}}`}</button>)}</div>
          </Field>
          <div>
            <span className="mb-1.5 block text-[11px] uppercase tracking-eyebrow text-mist">Aperçu avec un contexte d’exemple</span>
            <div className={clsx('rounded-2xl p-4 ring-1', channel === 'whatsapp' ? 'bg-champagne/[0.08] ring-champagne/20' : 'bg-white/[0.03] ring-white/[0.07]')}><Preview body={body} /></div>
            <p className="mt-2 text-[11px] leading-relaxed text-mist">{channel === 'whatsapp' ? (t?.approved && !changed ? 'Approuvé par Meta. Modifier le texte le renverra en revue.' : 'Sera soumis à Meta : statut « en revue » jusqu’à approbation (simulée).') : 'Pas d’approbation Meta requise pour ce canal.'} Rendu final : « {fill(body, SAMPLE).slice(0, 60)}… »</p>
          </div>
        </div>
      </AsyncForm>
    </Modal>
  )
}
