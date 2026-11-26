import clsx from 'clsx'
import { CheckCircle } from '@phosphor-icons/react'
import { Card } from '../crm/ui'
import { LANGS, useSetLang, useT } from './index'

/** Réglages › Profil : choix de la langue (interface et livrables de l’agence). */
export function LangPanel() {
  const { t, lang } = useT()
  const setLang = useSetLang()
  return (
    <Card title={t('set.langTitle')} kicker={t('set.langKicker')}>
      <div role="radiogroup" aria-label={t('lang.label')} className="grid grid-cols-2 gap-3">
        {LANGS.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={lang === l.id} onClick={() => lang !== l.id && void setLang(l.id)}
            className={clsx('flex items-center gap-2 rounded-2xl p-3 text-left text-[13px] ring-1 transition', lang === l.id ? 'bg-champagne/[0.07] ring-champagne/40' : 'bg-white/[0.02] ring-white/[0.06] hover:ring-white/15')}>
            <span className="num text-[11px] text-mist">{l.short}</span>{l.label}
            {lang === l.id && <CheckCircle size={14} weight="fill" className="ml-auto text-champagne" />}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-mist">{t('lang.hint')}</p>
    </Card>
  )
}

/** Sélecteur FR / PT (barre du haut, Réglages › Profil). */
export function LangSwitch({ className }: { className?: string }) {
  const { t, lang } = useT()
  const setLang = useSetLang()
  return (
    <div role="radiogroup" aria-label={t('lang.label')} className={clsx('flex items-center rounded-full bg-white/[0.03] p-0.5 ring-1 ring-white/[0.06]', className)}>
      {LANGS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={lang === l.id} title={l.label} onClick={() => lang !== l.id && void setLang(l.id)}
          className={clsx('rounded-full px-2 py-1 text-[11px] font-medium transition', lang === l.id ? 'bg-white/[0.09] text-bone ring-1 ring-white/10' : 'text-bone/50 hover:text-bone')}>
          {l.short}
        </button>
      ))}
    </div>
  )
}
