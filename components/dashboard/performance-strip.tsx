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
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function PerformanceStrip({
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
    <div className="relative">
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-2 pb-3"
      >
        {performances.map((perf) => (
          <motion.div key={perf.id} variants={itemVariants} className="snap-start">
            <Link
              href={`/athletes/${perf.athleteId}`}
              className="group flex h-full w-[180px] shrink-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="truncate text-sm font-semibold">{perf.athleteName}</div>
              <span className="mt-1.5 mb-3 inline-flex w-fit items-center truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                {formatDiscipline(perf.discipline)}
              </span>

              <div className="font-mono text-xl font-extrabold text-foreground">{perf.value}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {perf.isPB && <span className={cn('text-[10px] font-extrabold', GOLD)}>PB</span>}
                {!perf.isPB && perf.isSB && (
                  <span className={cn('text-[10px] font-extrabold', SILVER)}>SB</span>
                )}
                {perf.trend && (
                  <span
                    className={cn(
                      'font-mono text-[10px] font-semibold',
                      perf.trend.improved === null
                        ? 'text-muted-foreground'
                        : perf.trend.improved
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                    )}
                  >
                    {perf.trend.diff}
                  </span>
                )}
              </div>
              <div className="mt-auto pt-3 text-[10px] text-muted-foreground">
                {formatShortDate(perf.date)}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-2 right-0 h-[calc(100%-0.5rem)] w-10 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  )
}
