'use client'

import { memo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDiscipline } from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import type { PerformanceWidgetItem } from '@/lib/dashboard'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

// Juste les lettres, dégradé appliqué au texte (bg-clip-text) — pas de fond, pas
// de bordure, pas de pill. Le slot parent (w-8, voir plus bas) reste fixe pour
// garder la colonne valeur alignée d'une ligne à l'autre, badge présent ou non.
function AchievementBadge({ type }: { type: 'PB' | 'SB' }) {
  const isPB = type === 'PB'
  return (
    <span
      title={isPB ? 'Record personnel' : 'Record de la saison'}
      className="bg-clip-text text-sm font-bold text-transparent"
      style={{
        backgroundImage: isPB
          ? 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)'
          : 'linear-gradient(135deg, #9ca3af, #e5e7eb, #9ca3af)',
      }}
    >
      {type}
    </span>
  )
}

const PerformanceRow = memo(function PerformanceRow({ perf }: { perf: PerformanceWidgetItem }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ x: 3 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={`/athletes/${perf.athleteId}`}
        className="group relative flex min-h-11 items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 hover:bg-[#f0edf8] dark:hover:bg-primary/[0.03]"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {initials(perf.athleteName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{perf.athleteName}</div>
          <div className="hidden truncate text-xs text-muted-foreground sm:block">
            {formatDiscipline(perf.discipline)} · {formatFullDate(perf.date)}
          </div>
        </div>

        <div className="flex w-8 shrink-0 justify-center">
          {perf.isPB ? (
            <AchievementBadge type="PB" />
          ) : perf.isSB ? (
            <AchievementBadge type="SB" />
          ) : null}
        </div>

        <div className="w-[4.5rem] shrink-0 text-right">
          <div className="font-mono text-sm font-bold text-foreground">{perf.value}</div>
          {perf.trend && (
            <div
              className="font-mono text-sm font-semibold"
              style={{
                color:
                  perf.trend.improved === null
                    ? 'var(--muted-foreground)'
                    : perf.trend.improved
                      ? '#16a34a'
                      : '#dc2626',
              }}
            >
              {perf.trend.diff}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
})

export function PerformanceList({
  performances,
  emptyMessage,
}: {
  performances: PerformanceWidgetItem[]
  emptyMessage: string
}) {
  if (performances.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-card">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
    >
      {performances.map((perf) => (
        <PerformanceRow key={perf.id} perf={perf} />
      ))}
    </motion.div>
  )
}
