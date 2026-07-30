import Link from 'next/link'
import { Crown, Medal } from 'lucide-react'
import { formatDiscipline } from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

function RankBadge({ kind }: { kind: 'pb' | 'sb' }) {
  const isGold = kind === 'pb'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide shadow-sm ring-1',
        isGold
          ? 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 text-amber-950 ring-amber-300/60 shadow-amber-500/30'
          : 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-800 ring-slate-300/60 shadow-slate-400/30'
      )}
    >
      {isGold ? (
        <Crown className="size-2.5" strokeWidth={2.5} />
      ) : (
        <Medal className="size-2.5" strokeWidth={2.5} />
      )}
      {isGold ? 'PB' : 'SB'}
    </span>
  )
}

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
              {perf.isPB && <RankBadge kind="pb" />}
              {!perf.isPB && perf.isSB && <RankBadge kind="sb" />}
              <span
                className={cn(
                  'text-sm font-bold font-mono',
                  perf.isPB
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                    : perf.isSB
                      ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(148,163,184,0.35)]'
                      : 'text-primary'
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
