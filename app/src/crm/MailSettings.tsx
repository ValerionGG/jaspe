import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { EnvelopeSimple, PaperPlaneTilt, ArrowsClockwise, CheckCircle, Info } from '@phosphor-icons/react'
import { SoftBtn } from './ui'
import { toast, errText } from './forms'
import { action, useMe } from '../data/store'
import { useAgents } from '../data/collections'

type MailStatus = { configured: boolean; from: string | null; host: string | null }

/** Réglages › Intégrations : état du connecteur SMTP et e-mail de test vers sa propre adresse. */
export function MailSettings() {
  const me = useMe()
  const [agents] = useAgents()
  const [st, setSt] = useState<MailStatus | null>(null)
  const [unknown, setUnknown] = useState(false)
  const [busy, setBusy] = useState(false)
  const to = me?.mode === 'auth' ? me.user.email : agents.find((a) => (a as { email?: string }).email)?.email as string | undefined

  const load = () => action<MailStatus>('mail.status').then((s) => { setSt(s); setUnknown(false) }, () => { setSt({ configured: false, from: null, host: null }); setUnknown(true) })
  useEffect(() => { load() }, [])

  const test = async () => {
    if (!to) return toast('Aucune adresse e-mail sur votre profil', 'error')
    setBusy(true)
    try { await action('mail.test', { to }); toast(`E-mail de test envoyé à ${to}`) }
    catch (e) { toast(errText(e), 'error') }
    finally { setBusy(false) }
  }

  const on = !!st?.configured
  return (
    <div className={clsx('flex flex-wrap items-center gap-4 rounded-[1.3rem] bg-ink-800/80 p-4 ring-1', on ? 'ring-sage/25' : 'ring-white/[0.06]')}>
      <span className={clsx('grid size-10 shrink-0 place-items-center rounded-xl ring-1', on ? 'bg-sage/10 text-sage ring-sage/25' : 'bg-white/[0.03] text-mist ring-white/10')}><EnvelopeSimple size={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[14px] font-medium">
          E-mail (SMTP)
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] ring-1', on ? 'bg-sage/10 text-sage ring-sage/25' : 'bg-white/[0.03] text-mist ring-white/10')}>
            {on ? <><CheckCircle size={11} weight="fill" />configuré</> : 'non configuré'}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-bone/60">
          {st == null ? 'Vérification…'
            : on ? <>Les livrables validés partent réellement par e-mail depuis <span className="text-bone">{st.from}</span>, hors heures calmes de l’agence.</>
            : <span className="inline-flex items-start gap-1.5"><Info size={13} className="mt-0.5 shrink-0" />{unknown ? 'Serveur injoignable ou version de démonstration : aucun e-mail n’est envoyé.' : 'Aucun envoi réel : les e-mails restent consignés. Renseignez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM sur le serveur.'}</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <SoftBtn icon={<ArrowsClockwise size={13} />} onClick={() => { setSt(null); load() }}>Vérifier</SoftBtn>
        <SoftBtn tone="gold" disabled={!on || busy || !to} icon={<PaperPlaneTilt size={13} className={clsx(busy && 'animate-pulse')} />} onClick={test}>{busy ? 'Envoi…' : 'Envoyer un e-mail de test à moi-même'}</SoftBtn>
      </div>
    </div>
  )
}
