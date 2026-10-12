// Captures stylisées (composants) illustrant les leçons — fenêtre factice aux jetons du thème courant.
import clsx from 'clsx'
import { MagnifyingGlass, Sparkle, CheckCircle, Lightning, ChatCircleDots } from '@phosphor-icons/react'
import { img } from '../../data/mock'
import type { ShotKind } from './content'

const bar = (w: string, c = 'bg-white/[0.08]') => <span className={clsx('block h-1.5 rounded-full', c)} style={{ width: w }} />

function Body({ kind }: { kind: ShotKind }) {
  switch (kind) {
    case 'palette': return (
      <div className="mx-auto max-w-[320px] rounded-2xl bg-ink-700 p-3 ring-1 ring-white/[0.08]">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-[12px] text-bone/80"><MagnifyingGlass size={13} />générer L7<span className="ml-auto h-3.5 w-px animate-pulse bg-champagne" /></div>
        {['Générer L7 · Famille Martin', 'Ouvrir dossier VND-2026-0412', 'Nouveau dossier vendeur'].map((t, i) => (
          <div key={t} className={clsx('mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 text-[11.5px]', i === 0 ? 'bg-champagne/10 text-champagne-300 ring-1 ring-champagne/20' : 'text-bone/60')}><Lightning size={12} />{t}</div>
        ))}
      </div>
    )
    case 'kanban': return (
      <div className="grid grid-cols-3 gap-2">
        {['Préparation', 'Après RDV', 'Mandat'].map((c, i) => (
          <div key={c} className="rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/[0.05]">
            <div className="mb-2 text-[9.5px] uppercase tracking-eyebrow text-mist">{c}</div>
            {[0, 1].slice(0, i === 1 ? 2 : 1).map((k) => (
              <div key={k} className={clsx('mb-1.5 flex items-center gap-2 rounded-lg bg-ink-700 p-1.5 ring-1', i === 1 && k === 0 ? 'ring-champagne/40' : 'ring-white/[0.06]')}>
                <img src={img(['villa-pool', 'house-dusk', 'villa-sunset'][(i + k) % 3])} alt="" className="h-6 w-6 rounded-md object-cover" />
                <div className="flex-1 space-y-1">{bar('80%', 'bg-white/[0.12]')}{bar('50%')}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
    case 'stepper': return (
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 8 }, (_, i) => <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i < 3 ? 'bg-champagne' : i === 3 ? 'bg-champagne/40' : 'bg-white/[0.08]')} />)}
        </div>
        {['Projet de vie', 'Le bien', 'Calendrier', 'Prix'].map((t, i) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.05]">
            {i < 3 ? <CheckCircle size={15} weight="fill" className="text-sage" /> : <span className="h-[15px] w-[15px] rounded-full ring-1 ring-white/20" />}
            <span className="text-[11.5px] text-bone/80">{t}</span><span className="ml-auto">{bar(i < 3 ? '44px' : '22px', i < 3 ? 'bg-sage/40' : undefined)}</span>
          </div>
        ))}
      </div>
    )
    case 'paper': return (
      <div className="theme-dark mx-auto max-w-[300px] rounded-xl bg-bone-50 p-4 text-ink shadow-float">
        <div className="flex items-center justify-between"><span className="font-serif text-[15px] italic">Maison Riviera</span><span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[9px]">v2</span></div>
        <div className="relative mt-3 overflow-hidden rounded-lg"><img src={img('int-living')} alt="" className="h-20 w-full object-cover" /><span className="absolute bottom-1.5 left-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[8.5px] text-bone-50">Image retouchée par IA</span></div>
        <div className="mt-3 space-y-1.5">{bar('100%', 'bg-ink/15')}{bar('92%', 'bg-ink/15')}{bar('70%', 'bg-ink/15')}</div>
        <div className="mt-3 text-[8.5px] text-ink/50">Source : DVF, ventes 2025–2026 · consulté le 12/10/2026</div>
      </div>
    )
    case 'chat': return (
      <div className="mx-auto max-w-[300px] space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-sage/10 px-3 py-1.5 text-[10.5px] text-sage ring-1 ring-sage/20"><span>Opt-in WhatsApp · 02/10/2026</span><span>Fenêtre 24 h ouverte</span></div>
        <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/[0.05] px-3 py-2 text-[11.5px] text-bone/80">Bonjour, la visite tient toujours demain ?</div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-champagne/15 px-3 py-2 text-[11.5px] text-bone ring-1 ring-champagne/20">Bonjour <b className="text-champagne-300">{'{{prenom}}'}</b>, je vous confirme notre rendez-vous le <b className="text-champagne-300">{'{{date}}'}</b> à <b className="text-champagne-300">{'{{heure}}'}</b>.</div>
        <div className="flex items-center gap-1.5 text-[10px] text-mist"><Sparkle size={11} weight="fill" className="text-champagne-300" />Modèle approuvé · rappel J-1 programmé</div>
      </div>
    )
    case 'calendar': return (
      <div className="grid grid-cols-5 gap-1.5">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((d, i) => (
          <div key={d} className="rounded-xl bg-white/[0.03] p-1.5 ring-1 ring-white/[0.05]">
            <div className="mb-1.5 text-center text-[9.5px] text-mist">{d} {12 + i}</div>
            {i % 2 === 0 && <div className="mb-1 rounded-md bg-champagne/15 px-1 py-1 text-[8.5px] text-champagne-300">11:00 RDV</div>}
            {i !== 2 && <div className="rounded-md bg-sea/15 px-1 py-1 text-[8.5px] text-sea">{14 + i}:30 Visite</div>}
            {i === 1 && <div className="mt-1 flex items-center gap-1 text-[8px] text-sage"><ChatCircleDots size={9} />J-1 · H-2</div>}
          </div>
        ))}
      </div>
    )
    case 'routine': return (
      <div className="space-y-1.5">
        {[['AUT-046', 'Brief du matin', 'A', true], ['AUT-024', 'Neuf livrables après découverte', 'V', true], ['AUT-110', 'Rappels WhatsApp échus', 'A', true], ['AUT-131', 'Relance acquéreurs dormants', 'P', false]].map(([id, n, a, on]) => (
          <div key={id as string} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.05]">
            <span className="num text-[10px] text-mist">{id}</span><span className="flex-1 truncate text-[11.5px] text-bone/80">{n}</span>
            <span className="num rounded-full bg-white/[0.06] px-1.5 text-[9.5px] text-bone/60">{a}</span>
            <span className={clsx('relative h-3.5 w-6 rounded-full', on ? 'bg-champagne' : 'bg-white/15')}><span className={clsx('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-bone', on ? 'left-3' : 'left-0.5')} /></span>
          </div>
        ))}
      </div>
    )
    case 'kpi': return (
      <div className="grid grid-cols-3 gap-2">
        {[['CA signé', '168 k€'], ['Mandats', '14'], ['Délai', '74 j']].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white/[0.03] p-2.5 ring-1 ring-white/[0.05]"><div className="text-[9.5px] text-mist">{l}</div><div className="display mt-1 text-[1.4rem] leading-none">{v}</div></div>
        ))}
        <div className="col-span-3 flex h-16 items-end gap-1.5 rounded-xl bg-white/[0.03] p-2.5 ring-1 ring-white/[0.05]">
          {[38, 52, 44, 61, 58, 72, 66, 84, 79, 92].map((h, i) => <span key={i} className={clsx('flex-1 rounded-t', i > 7 ? 'bg-champagne' : 'bg-champagne/30')} style={{ height: `${h}%` }} />)}
        </div>
      </div>
    )
  }
}

export function Shot({ kind, className }: { kind: ShotKind; className?: string }) {
  return (
    <div className={clsx('rounded-[1.2rem] bg-ink-850 p-1 ring-1 ring-white/[0.07]', className)} aria-hidden>
      <div className="flex items-center gap-1.5 px-3 py-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-white/[0.12]" />)}<span className="ml-3 h-1.5 w-24 rounded-full bg-white/[0.06]" /></div>
      <div className="rounded-[0.95rem] bg-ink-800 p-4">{<Body kind={kind} />}</div>
    </div>
  )
}
