'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarRange, ChevronDown, Layers, Sun, TrendingUp, Warehouse, Wind } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  computeCategory,
  computeNiceAxis,
  computeSeasonBests,
  computeSeason,
  formatDiscipline,
  formatPerformanceValue,
  isLowerBetter,
} from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tint } from '@/lib/color'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Performance = AthleteDetail['performances'][number]
type EnvFilter = 'all' | 'indoor' | 'outdoor'

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent'

const LEVEL_STYLES: Record<string, string> = {
  N: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  IR: 'border-primary/30 bg-primary/10 text-primary',
  R: 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400',
  D: 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

function levelStyle(level: string): string {
  const prefix = level.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() ?? ''
  return LEVEL_STYLES[prefix] ?? 'border-border bg-muted text-muted-foreground'
}

function formatWind(raw: string): string {
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}`
}

export function PerformancesTab({
  performances,
  birthDate,
  disciplineColors,
}: {
  performances: Performance[]
  birthDate: Date | null
  disciplineColors: Record<string, string>
}) {
  const isLight = useIsLightTheme()
  const [openDiscipline, setOpenDiscipline] = useState<string | null>(null)
  const [season, setSeason] = useState(() => computeSeason(new Date()).seasonShort)
  const [envFilter, setEnvFilter] = useState<EnvFilter>('all')

  const seasonOptions = useMemo(() => {
    const set = new Set(performances.map((p) => computeSeason(p.recordedAt).seasonShort))
    set.add(computeSeason(new Date()).seasonShort)
    return Array.from(set).sort().reverse()
  }, [performances])

  const seasonBestIds = useMemo(() => {
    const bests = computeSeasonBests(performances)
    return new Set(Array.from(bests.values()).map((p) => p.id))
  }, [performances])

  const filtered = useMemo(() => {
    return performances.filter((p) => {
      if (season !== 'all' && computeSeason(p.recordedAt).seasonShort !== season) return false
      if (envFilter === 'indoor' && p.isIndoor !== true) return false
      if (envFilter === 'outdoor' && p.isIndoor !== false) return false
      return true
    })
  }, [performances, season, envFilter])

  const byDiscipline = useMemo(() => {
    const groups = new Map<string, Performance[]>()
    for (const perf of filtered) {
      const list = groups.get(perf.discipline) ?? []
      list.push(perf)
      groups.set(perf.discipline, list)
    }
    const entries = Array.from(groups.entries())
    entries.sort(([a], [b]) => {
      const scoreA = disciplineColors[a] ? 0 : 1
      const scoreB = disciplineColors[b] ? 0 : 1
      return scoreA - scoreB
    })
    return entries.map(([discipline, perfs]) => {
      const chronological = [...perfs].sort(
        (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
      )
      const recentFirst = [...chronological].reverse()
      const unit = perfs[0]?.unit ?? 's'
      const lowerBetter = isLowerBetter(unit)
      const best = recentFirst.reduce((acc, p) =>
        !acc || (lowerBetter ? p.value < acc.value : p.value > acc.value) ? p : acc
      )
      const chartData = chronological.map((p) => ({
        date: formatFullDate(p.recordedAt),
        value: p.value,
      }))
      const { domain, ticks } = computeNiceAxis(chronological.map((p) => p.value))
      return {
        discipline,
        performances: recentFirst,
        best,
        unit,
        chartData,
        domain,
        ticks,
      }
    })
  }, [filtered, disciplineColors])

  if (performances.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune performance enregistrée.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={season} onValueChange={(v) => v && setSeason(v)}>
          <SelectTrigger className="w-full gap-1.5 rounded-full border-primary/40 bg-primary/10 px-3.5 text-xs font-semibold text-primary sm:hidden">
            {season === 'all' ? (
              <Layers className="size-3.5 shrink-0" />
            ) : (
              <CalendarRange className="size-3.5 shrink-0" />
            )}
            <SelectValue placeholder="Saison">
              {(value: string | null) => (value === 'all' ? 'Toutes les saisons' : (value ?? ''))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les saisons</SelectItem>
            {seasonOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="no-scrollbar hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
          <button
            type="button"
            onClick={() => setSeason('all')}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              season === 'all'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="size-3.5" />
            Toutes
          </button>
          {seasonOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                season === s
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarRange className="size-3.5" />
              {s}
            </button>
          ))}
        </div>

        <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted p-1">
          {(
            [
              { key: 'all', label: 'Tous', icon: Layers },
              { key: 'indoor', label: 'Indoor', icon: Warehouse },
              { key: 'outdoor', label: 'Outdoor', icon: Sun },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setEnvFilter(opt.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                envFilter === opt.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <opt.icon className="size-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {byDiscipline.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune performance {season !== 'all' ? `pour la saison ${season}` : ''}
            {envFilter !== 'all' ? ` (${envFilter === 'indoor' ? 'indoor' : 'outdoor'})` : ''}.
          </p>
          {(season !== 'all' || envFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSeason('all')
                setEnvFilter('all')
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Voir toutes les performances
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {byDiscipline.map(
            ({ discipline, performances: perfs, best, unit, chartData, domain, ticks }) => {
              const isOpen = openDiscipline === discipline
              const lowerBetter = isLowerBetter(unit)
              const color = disciplineColors[discipline] ?? null
              return (
                <div
                  key={discipline}
                  className={cn(
                    'overflow-hidden rounded-2xl border shadow-sm',
                    color ? undefined : 'border-border bg-card'
                  )}
                  style={
                    color
                      ? {
                          background: [
                            // Filet de "vitesse" — lignes diagonales très discrètes, façon lignes
                            // de sprint, à peine visibles.
                            `repeating-linear-gradient(115deg, ${isLight ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.05)'} 0px, ${isLight ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.05)'} 1px, transparent 1px, transparent 13px)`,
                            `linear-gradient(to right, ${tint(color, isLight ? 22 : 13)}, ${tint(color, isLight ? 6 : 3)})`,
                          ].join(', '),
                          borderColor: tint(color, isLight ? 45 : 24),
                        }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpenDiscipline(isOpen ? null : discipline)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      >
                        <ChevronDown className="size-3.5" />
                      </motion.span>
                      {color && (
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-bold">{formatDiscipline(discipline)}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {perfs.length} performance{perfs.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Record
                      </div>
                      <span className={cn('text-base font-extrabold', GOLD)}>
                        {formatPerformanceValue(best.value, best.unit)}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-border"
                      >
                        {chartData.length > 1 && (
                          <div className="h-48 border-b border-border px-2 py-4 sm:px-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={chartData}
                                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="var(--border)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                  tickLine={false}
                                  axisLine={{ stroke: 'var(--border)' }}
                                />
                                <YAxis
                                  reversed={lowerBetter}
                                  width={52}
                                  domain={domain}
                                  ticks={ticks}
                                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(v: number) => formatPerformanceValue(v, unit)}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    fontSize: 12,
                                  }}
                                  labelStyle={{ color: 'var(--muted-foreground)' }}
                                  formatter={(v) => [
                                    formatPerformanceValue(Number(v), unit),
                                    'Perf',
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="var(--chart-1)"
                                  strokeWidth={2}
                                  isAnimationActive={false}
                                  dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="divide-y divide-border sm:hidden">
                          {perfs.map((perf) => {
                            const isSB = seasonBestIds.has(perf.id) && !perf.isPersonalBest
                            const { seasonShort } = computeSeason(perf.recordedAt)
                            return (
                              <div key={perf.id} className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'w-6 shrink-0 text-right text-[10px] font-extrabold',
                                      perf.isPersonalBest ? GOLD : isSB ? SILVER : ''
                                    )}
                                  >
                                    {perf.isPersonalBest ? 'PB' : isSB ? 'SB' : ''}
                                  </span>
                                  <span className="w-16 shrink-0 font-mono text-base font-bold tabular-nums">
                                    {formatPerformanceValue(perf.value, perf.unit)}
                                  </span>
                                  <span className="w-10 shrink-0">
                                    {perf.isIndoor !== null && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'h-4.5 px-1.5 text-[9px]',
                                          perf.isIndoor
                                            ? 'border-transparent bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                                            : 'border-transparent bg-[var(--chart-3)]/15 text-[var(--chart-3)]'
                                        )}
                                      >
                                        {perf.isIndoor ? 'IN' : 'OUT'}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="flex flex-1 items-center gap-1 font-mono text-sm text-muted-foreground">
                                    {perf.wind && (
                                      <>
                                        <Wind className="size-4 shrink-0" />
                                        {formatWind(perf.wind)}
                                      </>
                                    )}
                                  </span>
                                  <div className="flex w-20 shrink-0 items-center justify-end gap-1.5">
                                    {perf.level && (
                                      <>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'h-5 shrink-0 px-1.5 text-[10px]',
                                            levelStyle(perf.level)
                                          )}
                                        >
                                          {perf.level}
                                        </Badge>
                                        {perf.levelPoints !== null && (
                                          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                                            {perf.levelPoints}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                  <span className="truncate">
                                    {formatFullDate(perf.recordedAt)}
                                    {perf.venue ? ` · ${perf.venue}` : ''}
                                  </span>
                                  <span className="shrink-0">{seasonShort}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="no-scrollbar hidden overflow-x-auto sm:block">
                          <table className="w-full table-fixed text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                                <th className="w-32 px-5 py-2 font-medium">Date</th>
                                <th className="px-3 py-2 font-medium">Performance</th>
                                <th className="hidden w-28 px-3 py-2 font-medium sm:table-cell">
                                  Lieu
                                </th>
                                <th className="hidden w-24 px-3 py-2 font-medium md:table-cell">
                                  Saison
                                </th>
                                <th className="hidden w-24 px-3 py-2 font-medium md:table-cell">
                                  Cat.
                                </th>
                                <th className="w-32 px-5 py-2 text-right font-medium">Niveau</th>
                              </tr>
                            </thead>
                            <tbody>
                              {perfs.map((perf) => {
                                const isSB = seasonBestIds.has(perf.id) && !perf.isPersonalBest
                                const { seasonShort } = computeSeason(perf.recordedAt)
                                const category = computeCategory(perf.recordedAt, birthDate)
                                return (
                                  <tr
                                    key={perf.id}
                                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                                  >
                                    <td className="truncate px-5 py-2.5 whitespace-nowrap text-muted-foreground">
                                      {formatFullDate(perf.recordedAt)}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            'w-6 shrink-0 text-right text-[10px] font-extrabold',
                                            perf.isPersonalBest ? GOLD : isSB ? SILVER : ''
                                          )}
                                        >
                                          {perf.isPersonalBest ? 'PB' : isSB ? 'SB' : ''}
                                        </span>
                                        <span className="w-16 shrink-0 font-mono font-bold tabular-nums">
                                          {formatPerformanceValue(perf.value, perf.unit)}
                                        </span>
                                        <span className="w-10 shrink-0">
                                          {perf.isIndoor !== null && (
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'h-4.5 px-1.5 text-[9px]',
                                                perf.isIndoor
                                                  ? 'border-transparent bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                                                  : 'border-transparent bg-[var(--chart-3)]/15 text-[var(--chart-3)]'
                                              )}
                                            >
                                              {perf.isIndoor ? 'IN' : 'OUT'}
                                            </Badge>
                                          )}
                                        </span>
                                        <span className="flex flex-1 items-center gap-1 font-mono text-sm text-muted-foreground">
                                          {perf.wind && (
                                            <>
                                              <Wind className="size-4 shrink-0" />
                                              {formatWind(perf.wind)}
                                            </>
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="hidden truncate px-3 py-2.5 text-muted-foreground sm:table-cell">
                                      {perf.venue || '—'}
                                    </td>
                                    <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground md:table-cell">
                                      {seasonShort}
                                    </td>
                                    <td className="hidden truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                                      {category ?? '—'}
                                    </td>
                                    <td className="px-5 py-2.5 text-right">
                                      {perf.level || perf.levelPoints !== null ? (
                                        <div className="flex items-center justify-end gap-1.5">
                                          {perf.level && (
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'h-5 px-1.5 text-[10px]',
                                                levelStyle(perf.level)
                                              )}
                                            >
                                              {perf.level}
                                            </Badge>
                                          )}
                                          {perf.levelPoints !== null && (
                                            <span className="w-12 shrink-0 text-xs text-muted-foreground">
                                              {perf.levelPoints} pts
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}
