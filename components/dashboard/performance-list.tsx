'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDiscipline } from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { tint } from '@/lib/color'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import { cn } from '@/lib/utils'

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function PerformanceList({
  performances,
  emptyMessage,
}: {
  performances: PerformanceWidgetItem[]
  emptyMessage: string
}) {
  const isLight = useIsLightTheme()

  if (performances.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
      {performances.map((perf) => {
        const color = perf.color
        return (
          <motion.div key={perf.id} variants={itemVariants}>
            <Link
              href={`/athletes/${perf.athleteId}`}
              className={cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-card px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10',
                color ? 'hover:brightness-105' : 'border-border hover:border-primary/40'
              )}
              style={
                color
                  ? {
                      backgroundColor: tint(color, isLight ? 16 : 9),
                      borderColor: tint(color, isLight ? 45 : 24),
                    }
                  : undefined
              }
            >
              {color && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: color }}
                />
              )}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <div className="relative flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{perf.athleteName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDiscipline(perf.discipline)} · {formatFullDate(perf.date)}
                </div>
              </div>
              <div className="relative text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  {perf.isPB && <span className={cn('text-[11px] font-extrabold', GOLD)}>PB</span>}
                  {!perf.isPB && perf.isSB && (
                    <span className={cn('text-[11px] font-extrabold', SILVER)}>SB</span>
                  )}
                  <span className="text-sm font-bold font-mono text-foreground">{perf.value}</span>
                </div>
                {perf.trend && (
                  <div
                    className={cn(
                      'text-xs font-semibold font-mono mt-0.5',
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
        )
      })}
    </motion.div>
  )
}
