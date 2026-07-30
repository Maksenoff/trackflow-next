import Link from 'next/link'
import { formatDiscipline } from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

export function PerformanceList({
  performances,
  emptyMessage,
}: {
  performances: PerformanceWidgetItem[]
  emptyMessage: string
}) {
  if (performances.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-10 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {performances.map((perf) => (
        <Link
          key={perf.id}
          href={`/athletes/${perf.athleteId}`}
          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{perf.athleteName}</div>
            <div className="text-xs text-muted-foreground">
              {formatDiscipline(perf.discipline)} · {formatFullDate(perf.date)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1.5">
              {perf.isPB && (
                <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400">
                  PB
                </span>
              )}
              {!perf.isPB && perf.isSB && (
                <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400">
                  SB
                </span>
              )}
              <span className="text-sm font-bold font-mono text-primary">{perf.value}</span>
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
      ))}
    </div>
  )
}
