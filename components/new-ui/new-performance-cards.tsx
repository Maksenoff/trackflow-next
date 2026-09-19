'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

const MotionLink = motion.create(Link)

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** "12,31 s" / "1:23,45" → [nombre, unité] — formatPerformanceValue (lib/performance.ts)
 *  ne met pas toujours d'unité (temps ≥ 1 min affiché "m:ss.cc" seul). */
function splitValue(value: string): [string, string] {
  const i = value.lastIndexOf(' ')
  return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + 1)]
}

function PerfCard({
  perf,
  index,
  mode,
  hiddenFromSm,
}: {
  perf: PerformanceWidgetItem
  index: number
  mode: 'coach' | 'athlete'
  /** Au-delà de `desktopLimit` (cf. `PerfGrid`) : visible en dessous de `sm:`
   * uniquement, mobile affiche une tuile de plus que desktop. */
  hiddenFromSm?: boolean
}) {
  const isNeg = perf.trend?.improved === false
  const trendColor = isNeg ? 'var(--nu-ko)' : 'var(--nu-ok)'
  const flag = perf.isPB ? 'PB' : perf.isSB ? 'SB' : null
  const [num, unit] = splitValue(perf.value)
  const athlete = mode === 'athlete'

  return (
    <MotionLink
      href={`/athletes/${perf.athleteId}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.2, 0.9, 0.25, 1], delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl p-4',
        hiddenFromSm && 'sm:hidden'
      )}
      style={{
        background: 'var(--nu-surf)',
        border: '1px solid var(--nu-line)',
        boxShadow:
          flag === 'PB'
            ? 'inset 0 1px 0 var(--nu-rim), 0 0 0 1px color-mix(in srgb, var(--nu-pb) 30%, transparent), 0 10px 30px color-mix(in srgb, var(--nu-pb) 8%, transparent)'
            : flag === 'SB'
              ? 'inset 0 1px 0 var(--nu-rim), 0 0 0 1px color-mix(in srgb, #4c8dff 30%, transparent)'
              : 'inset 0 1px 0 var(--nu-rim)',
        minHeight: athlete ? 204 : 106,
      }}
    >
      {flag && (
        <span
          className="absolute top-3 right-3 rounded-[5px] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide"
          style={{
            background: flag === 'PB' ? 'var(--nu-pb)' : '#4c8dff',
            color: flag === 'PB' ? '#2e2100' : '#04173a',
          }}
        >
          {flag}
        </span>
      )}

      {!athlete && (
        <div className="mb-2.5 flex min-w-0 items-center gap-2">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
          >
            {initials(perf.athleteName)}
          </span>
          <b className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--nu-txt)' }}>
            {perf.athleteName}
          </b>
        </div>
      )}

      <div
        className={cn(
          'truncate font-semibold uppercase',
          athlete ? 'text-[12px] tracking-[0.06em]' : 'text-[11px] tracking-[0.08em]'
        )}
        style={{ color: 'var(--nu-dim)' }}
      >
        {perf.discipline}
      </div>

      <div className="mt-auto flex items-baseline gap-1 pt-3">
        <span
          className="nu-num leading-[0.9] font-bold"
          style={{ fontSize: athlete ? 44 : 26, color: 'var(--nu-txt)' }}
        >
          {num}
        </span>
        {unit && (
          <span style={{ color: 'var(--nu-dim)', fontSize: athlete ? 16 : 12 }}>{unit}</span>
        )}
      </div>

      {perf.trend?.improved !== null && perf.trend && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
            style={{
              color: trendColor,
              background: `color-mix(in srgb, ${trendColor} 16%, transparent)`,
            }}
          >
            <ArrowUp className={cn('size-[11px]', isNeg && 'rotate-180')} />
            {perf.trend.diff}
          </span>
        </div>
      )}

      {athlete && (
        <div className="mt-2.5 text-[11.5px] opacity-80" style={{ color: 'var(--nu-dim)' }}>
          {perf.date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
      )}
    </MotionLink>
  )
}

export function PerfGrid({
  items,
  mode,
  footer,
  emptyMessage = 'Aucune performance enregistrée.',
  desktopLimit,
}: {
  items: PerformanceWidgetItem[]
  mode: 'coach' | 'athlete'
  footer?: React.ReactNode
  emptyMessage?: string
  /** Nombre de tuiles visibles à partir de `sm:` — au-delà, une tuile reste
   * affichée en dessous de `sm:` (mobile) mais disparaît sur desktop.
   * `undefined` = toutes les tuiles restent visibles partout. */
  desktopLimit?: number
}) {
  if (items.length === 0) {
    return (
      <p className="mt-3 py-8 text-center text-xs" style={{ color: 'var(--nu-dim)' }}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Toujours 3 colonnes à partir de `sm:` dans les deux vues (mockup :
          .pf-grid reste sur repeat(3,...) quel que soit le mode, seule la
          hauteur/le padding des tuiles change) — 2 colonnes en dessous,
          1 sur très petit écran. */}
      <div className="mt-3 grid content-start gap-3 [grid-template-columns:1fr] min-[401px]:[grid-template-columns:repeat(2,minmax(0,1fr))] sm:[grid-template-columns:repeat(3,minmax(0,1fr))]">
        {items.map((p, i) => (
          <PerfCard
            key={p.id}
            perf={p}
            index={i}
            mode={mode}
            hiddenFromSm={desktopLimit !== undefined && i >= desktopLimit}
          />
        ))}
      </div>
      {footer && (
        <div
          className="mt-5 flex items-center justify-between gap-3.5 border-t pt-3 text-[12.5px]"
          style={{ borderColor: 'var(--nu-line)', color: 'var(--nu-dim)' }}
        >
          <span>{footer}</span>
        </div>
      )}
    </div>
  )
}
