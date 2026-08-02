'use client'

import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  calcTrend,
  computeSeasonBests,
  formatDiscipline,
  formatPerformanceValue,
} from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Performance = AthleteDetail['performances'][number]

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent'

export function PerformancesTab({ performances }: { performances: Performance[] }) {
  const [openDiscipline, setOpenDiscipline] = useState<string | null>(null)

  const seasonBestIds = useMemo(() => {
    const bests = computeSeasonBests(performances)
    return new Set(Array.from(bests.values()).map((p) => p.id))
  }, [performances])

  const byDiscipline = useMemo(() => {
    const groups = new Map<string, Performance[]>()
    for (const perf of performances) {
      const list = groups.get(perf.discipline) ?? []
      list.push(perf)
      groups.set(perf.discipline, list)
    }
    return Array.from(groups.entries()).map(([discipline, perfs]) => {
      const chronological = [...perfs].sort(
        (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
      )
      const trends = new Map<string, ReturnType<typeof calcTrend>>()
      chronological.forEach((perf, i) => {
        trends.set(perf.id, calcTrend(perf, i > 0 ? chronological[i - 1] : null))
      })
      const recentFirst = [...chronological].reverse()
      const pb = recentFirst.find((p) => p.isPersonalBest)
      return { discipline, performances: recentFirst, trends, pb }
    })
  }, [performances])

  if (byDiscipline.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune performance enregistrée.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {byDiscipline.map(({ discipline, performances: perfs, trends, pb }) => {
        const isOpen = openDiscipline === discipline
        return (
          <div
            key={discipline}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenDiscipline(isOpen ? null : discipline)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
            >
              <div>
                <div className="font-bold">{formatDiscipline(discipline)}</div>
                <div className="text-xs text-muted-foreground">
                  {perfs.length} performance{perfs.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pb && (
                  <span className={cn('text-sm font-bold', GOLD)}>
                    {formatPerformanceValue(pb.value, pb.unit)}
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {perfs.map((perf) => {
                  const trend = trends.get(perf.id)
                  const isSB = seasonBestIds.has(perf.id) && !perf.isPersonalBest
                  return (
                    <div
                      key={perf.id}
                      className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0"
                    >
                      <div className="text-sm text-muted-foreground">
                        {formatFullDate(perf.recordedAt)}
                        {perf.isCompetition && <span className="ml-2 text-xs">🏆 compétition</span>}
                        {perf.venue && <span className="ml-2 text-xs">· {perf.venue}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        {perf.isPersonalBest && (
                          <span className={cn('text-xs font-extrabold', GOLD)}>PB</span>
                        )}
                        {isSB && <span className={cn('text-xs font-extrabold', SILVER)}>SB</span>}
                        <span className="font-mono text-sm font-bold">
                          {formatPerformanceValue(perf.value, perf.unit)}
                        </span>
                        {trend && (
                          <span
                            className={cn(
                              'w-14 font-mono text-xs font-semibold',
                              trend.improved === null
                                ? 'text-muted-foreground'
                                : trend.improved
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-500 dark:text-red-400'
                            )}
                          >
                            {trend.diff}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
