// Réglages › Intégrations : « Débrief par WhatsApp » — numéro Jaspe, numéros de conseillers autorisés, état webhook et transcription.
// Les secrets restent dans les variables d’environnement du serveur ; seul leur état (présent / absent) est affiché.
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { WhatsappLogo, Plus, Trash, CheckCircle, Warning, Info } from '@phosphor-icons/react'
import { Card, SoftBtn, IconBtn } from './ui'
import { Field, Input, Select, toast, errText } from './forms'
import { useSettings, useAgents } from '../data/collections'
import { action, type Doc } from '../data/store'

type AgentRef = { agentId: string; name?: string }
type Cfg = { id: string; jaspeNumber?: string; agents?: Record<string, AgentRef | string> }
type Status = {
  webhook: { verifyToken: boolean; appSecret: boolean; path: string; lastAt: string | null }
  sending: { token: boolean; phoneNumberId: boolean }
  transcription: { configured: boolean; model: string | null; host: string | null; language: string }
  stats: { received?: number; briefs?: number; voice?: number; ignored?: number; approved?: number; rejected?: number; sttMissing?: number; badSignature?: number }
  share: number | null; target: number; pending: number
}

const Dot = ({ ok, children }: { ok: boolean; children: string }) => (
  <div className="flex items-center gap-2 text-[12.5px]">
    {ok ? <CheckCircle size={14} weight="fill" className="text-sage" /> : <Warning size={14} weight="fill" className="text-champagne-300" />}
    <span className={ok ? 'text-bone/80' : 'text-bone/60'}>{children}</span>
  </div>
)

export function WhatsAppSettings() {
  const [docs, ops] = useSettings()
  const [agents] = useAgents()
  const cfg = (docs.find((d) => d.id === 'whatsapp-agents') as (Cfg & Doc) | undefined) ?? { id: 'whatsapp-agents', agents: {} }
  const [status, setStatus] = useState<Status | null>(null)
  const [jaspe, setJaspe] = useState(cfg.jaspeNumber ?? '')
  const [phone, setPhone] = useState('')
  const [agentId, setAgentId] = useState('')
  useEffect(() => { setJaspe(cfg.jaspeNumber ?? '') }, [cfg.jaspeNumber])
  useEffect(() => { action<Status>('whatsapp.status').then(setStatus).catch(() => setStatus(null)) }, [docs.length])

  const save = async (patch: Partial<Cfg>, ok: string) => {
    try {
      if (docs.some((d) => d.id === 'whatsapp-agents')) await ops.update('whatsapp-agents', patch as Partial<Doc>)
      else await ops.create({ id: 'whatsapp-agents', agents: {}, ...patch } as unknown as Partial<Doc>)
      toast(ok)
    } catch (e) { toast(errText(e), 'error') }
  }
  const map = cfg.agents ?? {}
  const add = () => {
    const d = phone.replace(/\D/g, '')
    if (d.length < 8) { toast('Numéro au format international, ex. +33 6 12 34 56 78', 'error'); return }
    const a = agents.find((x) => x.id === agentId)
    if (!a) { toast('Choisissez le conseiller', 'error'); return }
    save({ agents: { ...map, [`+${d}`]: { agentId: a.id, name: a.name } } }, `${a.name} autorisé(e) à envoyer ses débriefs`).then(() => { setPhone(''); setAgentId('') })
  }
  const del = (k: string) => { const next = { ...map }; delete next[k]; save({ agents: next }, 'Numéro retiré') }
  const nameOf = (v: AgentRef | string) => (typeof v === 'string' ? agents.find((a) => a.id === v)?.name ?? v : v.name ?? agents.find((a) => a.id === v.agentId)?.name ?? v.agentId)
  const s = status?.stats ?? {}

  return (
    <Card title={<span className="flex items-center gap-2"><WhatsappLogo size={18} weight="light" className="text-sage" />Débrief par WhatsApp</span>} kicker="Vocal ou texte → plan d’action à valider">
      <p className="mb-4 text-[12.5px] leading-relaxed text-bone/65">Sur le parking, le conseiller envoie un vocal ou un texte au numéro Jaspe. Le message est transcrit, transformé en plan d’action et placé dans <span className="text-bone">Tâches &amp; validations</span> : rien n’est lancé sans validation dans l’app.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Numéro Jaspe (WhatsApp Business)" hint="Numéro affiché aux conseillers ; le jeton et l’identifiant du numéro restent côté serveur.">
            <div className="flex gap-2"><Input value={jaspe} onChange={(e) => setJaspe(e.target.value)} placeholder="+33 7 00 00 00 00" /><SoftBtn onClick={() => save({ jaspeNumber: jaspe.trim() }, 'Numéro Jaspe enregistré')}>Enregistrer</SoftBtn></div>
          </Field>
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-eyebrow text-mist">Numéros de conseillers autorisés</div>
            <div className="space-y-1.5">
              {Object.keys(map).length === 0 && <div className="rounded-xl bg-white/[0.02] p-3 text-[12px] text-mist ring-1 ring-white/[0.05]">Aucun numéro : tous les messages reçus sont ignorés et journalisés.</div>}
              {Object.entries(map).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.05]">
                  <span className="num text-[12.5px]">{k}</span><span className="flex-1 truncate text-[12.5px] text-bone/70">{nameOf(v)}</span>
                  <IconBtn label={`Retirer ${k}`} onClick={() => del(k)}><Trash size={13} /></IconBtn>
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 912 345 678" aria-label="Numéro du conseiller" />
              <Select value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="Conseiller"><option value="">Conseiller…</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
              <SoftBtn tone="gold" icon={<Plus size={13} />} onClick={add}>Ajouter</SoftBtn>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {status ? <>
            <div className="space-y-1.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
              <div className="mb-1 text-[11px] uppercase tracking-eyebrow text-mist">Webhook Meta · <span className="num normal-case">{status.webhook.path}</span></div>
              <Dot ok={status.webhook.verifyToken}>{status.webhook.verifyToken ? 'Jeton de vérification défini' : 'WHATSAPP_VERIFY_TOKEN absent'}</Dot>
              <Dot ok={status.webhook.appSecret}>{status.webhook.appSecret ? 'Signature X-Hub-Signature-256 vérifiée' : 'WHATSAPP_APP_SECRET absent : webhook refusé'}</Dot>
              <Dot ok={status.sending.token && status.sending.phoneNumberId}>{status.sending.token ? 'Réponses envoyées au conseiller' : 'WHATSAPP_TOKEN absent : réponses consignées'}</Dot>
              <div className="pt-1 text-[11.5px] text-mist">{status.webhook.lastAt ? `Dernier appel : ${new Date(status.webhook.lastAt).toLocaleString('fr-FR')}` : 'Aucun appel reçu pour l’instant'}{s.badSignature ? ` · ${s.badSignature} signature(s) refusée(s)` : ''}</div>
            </div>
            <div className="space-y-1.5 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
              <div className="mb-1 text-[11px] uppercase tracking-eyebrow text-mist">Transcription des vocaux</div>
              <Dot ok={status.transcription.configured}>{status.transcription.configured ? `${status.transcription.host ?? 'Service'} · ${status.transcription.model ?? 'modèle par défaut'} · ${status.transcription.language}` : 'Non configurée : le conseiller est invité à écrire'}</Dot>
              <div className="flex items-start gap-1.5 pt-1 text-[11.5px] text-mist"><Info size={12} className="mt-0.5 shrink-0" />Service tiers (JASPE_STT_URL, JASPE_STT_KEY, JASPE_STT_MODEL) : les vocaux y transitent, à inscrire au registre RGPD.</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([['Part WhatsApp', status.share === null ? '—' : `${status.share} %`, status.share !== null && status.share >= status.target], ['Débriefs reçus', String(s.briefs ?? 0), false], ['À valider', String(status.pending), false]] as const).map(([l, v, good]) => (
                <div key={l} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]"><div className="text-[11px] text-mist">{l}</div><div className={clsx('display mt-1 text-[1.6rem] leading-none', good && 'text-sage')}>{v}</div></div>
              ))}
            </div>
            <div className="text-[11.5px] text-mist">Objectif : ≥ {status.target} % des débriefs par WhatsApp · {s.ignored ?? 0} message(s) de numéros inconnus ignoré(s)</div>
          </> : <div className="rounded-xl bg-white/[0.02] p-3 text-[12px] text-mist ring-1 ring-white/[0.05]">État indisponible : le serveur Jaspe n’est pas joignable (version hors ligne).</div>}
        </div>
      </div>
    </Card>
  )
}
