import Link from 'next/link'
import { formatDiscipline } from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(148,163,184,0.35)]'

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
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors border-b last:border-b-0"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{perf.athleteName}</div>
            <div className="text-xs text-muted-foreground">
              {formatDiscipline(perf.discipline)} · {formatFullDate(perf.date)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1.5">
              {perf.isPB && <span className={cn('text-[11px] font-extrabold', GOLD)}>PB</span>}
              {!perf.isPB && perf.isSB && (
                <span className={cn('text-[11px] font-extrabold', SILVER)}>SB</span>
              )}
              <span
                className={cn(
                  'text-sm font-bold font-mono',
                  perf.isPB ? GOLD : perf.isSB ? SILVER : 'text-primary'
                )}
              >
                {perf.value}
              </span>
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
