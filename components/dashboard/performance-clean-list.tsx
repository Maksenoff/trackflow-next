'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDiscipline } from '@/lib/performance'
import { formatShortDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { PerformanceWidgetItem } from '@/lib/dashboard'

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function PerformanceCleanList({
  performances,
  emptyMessage,
}: {
  performances: PerformanceWidgetItem[]
  emptyMessage: string
}) {
  if (performances.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {performances.map((perf) => (
        <motion.div key={perf.id} variants={itemVariants}>
          <Link
            href={`/athletes/${perf.athleteId}`}
            className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{perf.athleteName}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  {formatDiscipline(perf.discipline)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatShortDate(perf.date)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {perf.isPB && <span className={cn('text-[10px] font-extrabold', GOLD)}>PB</span>}
                {!perf.isPB && perf.isSB && (
                  <span className={cn('text-[10px] font-extrabold', SILVER)}>SB</span>
                )}
                <span className="font-mono text-sm font-bold text-foreground">{perf.value}</span>
              </div>
              {perf.trend && (
                <div
                  className={cn(
                    'mt-0.5 font-mono text-xs font-semibold',
                    perf.trend.improved === null
                      ? 'text-muted-foreground'
                      : perf.trend.improved
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {perf.trend.diff}
                </div>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
