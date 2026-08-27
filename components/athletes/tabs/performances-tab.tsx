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
  isHandTimed,
  isLowerBetter,
} from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import { baseDisciplineCode } from '@/lib/disciplines'
import { DisciplinePictogram } from '@/components/athletes/discipline-pictogram'
import { Badge } from '@/components/ui/badge'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Performance = AthleteDetail['performances'][number]
type EnvFilter = 'all' | 'indoor' | 'outdoor'

// PB : dégradé gold exact demandé (135deg, #f59e0b -> #fbbf24), pas l'ancien
// dégradé Tailwind jaune/ambre à 3 stops.
const GOLD_STYLE = {
  backgroundImage: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  WebkitBackgroundClip: 'text' as const,
  backgroundClip: 'text' as const,
  color: 'transparent',
}
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

/** Couleur choisie pour la spécialité — la perf réelle peut être enregistrée sous un
 * code variant (ex: "110m-haies-107cm"), on retombe sur le code de base au besoin. */
function colorForDiscipline(
  discipline: string,
  disciplineColors: Record<string, string>
): string | null {
  return disciplineColors[discipline] ?? disciplineColors[baseDisciplineCode(discipline)] ?? null
}

export function PerformancesTab({
  performances,
  birthDate,
  disciplineColors,
  disciplineOrder,
}: {
  performances: Performance[]
  birthDate: Date | null
  disciplineColors: Record<string, string>
  /** Ordre choisi par l'athlète (drag & drop sur le formulaire d'édition) — les
   * bandeaux de discipline suivent cet ordre plutôt que l'ordre d'apparition
   * des performances. */
  disciplineOrder: string[]
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

  const seasonBests = useMemo(() => computeSeasonBests(performances), [performances])
  const seasonBestIds = useMemo(
    () => new Set(Array.from(seasonBests.values()).map((p) => p.id)),
    [seasonBests]
  )

  // Record all-time (PB) par discipline, calculé sur l'historique complet de
  // l'athlète — jamais sur `filtered`, sinon le badge "PB" de l'en-tête varie
  // avec le filtre saison/indoor-outdoor et se confond avec le SB (correctif
  // 2026-08-24 : le PB doit rester le record all-time quel que soit le filtre actif).
  const allTimeBests = useMemo(() => {
    const map = new Map<string, Performance>()
    for (const perf of performances) {
      if (isHandTimed(perf.value, perf.unit)) continue
      const current = map.get(perf.discipline)
      if (!current) {
        map.set(perf.discipline, perf)
        continue
      }
      const better = isLowerBetter(perf.unit)
        ? perf.value < current.value
        : perf.value > current.value
      if (better) map.set(perf.discipline, perf)
    }
    return map
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
      // Priorité à l'ordre choisi par l'athlète (drag & drop sur son profil) — via le
      // code de base pour matcher aussi les codes variants FFA (ex: "110m-haies-107cm").
      const idxA = disciplineOrder.indexOf(baseDisciplineCode(a))
      const idxB = disciplineOrder.indexOf(baseDisciplineCode(b))
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      // Ni l'une ni l'autre dans les spécialités choisies (ex: discipline découverte
      // via sync FFA sans avoir été ajoutée en spécialité) : coloré d'abord.
      const scoreA = colorForDiscipline(a, disciplineColors) ? 0 : 1
      const scoreB = colorForDiscipline(b, disciplineColors) ? 0 : 1
      return scoreA - scoreB
    })
    return entries.map(([discipline, perfs]) => {
      const chronological = [...perfs].sort(
        (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
      )
      const recentFirst = [...chronological].reverse()
      const unit = perfs[0]?.unit ?? 's'
      const best = allTimeBests.get(discipline) ?? recentFirst[0]
      const seasonBest = seasonBests.get(discipline) ?? null
      const chartData = chronological.map((p) => ({
        date: formatFullDate(p.recordedAt),
        value: p.value,
      }))
      const { domain, ticks } = computeNiceAxis(chronological.map((p) => p.value))
      return {
        discipline,
        performances: recentFirst,
        best,
        seasonBest,
        unit,
        chartData,
        domain,
        ticks,
      }
    })
  }, [filtered, disciplineColors, disciplineOrder, seasonBests, allTimeBests])

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
        {/* Une seule rangée de pills scrollable, sur mobile comme desktop (fusion du
            Select mobile + de la rangée desktop, correctif 2026-08-28) : le slide
            tactile fonctionne nativement sur mobile via overflow-x-auto, et
            scrollbar-thin (au lieu de no-scrollbar) rend la scrollbar visible sur
            desktop plutôt que de masquer toute indication qu'il reste des saisons
            à faire défiler. */}
        <div className="scrollbar-thin flex min-w-0 items-center gap-2 overflow-x-auto pb-1.5">
          <button
            type="button"
            onClick={() => setSeason('all')}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              season === 'all'
                ? 'bg-gradient-selected text-white shadow-sm shadow-primary/25'
                : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
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
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                season === s
                  ? 'bg-gradient-selected text-white shadow-sm shadow-primary/25'
                  : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <CalendarRange className="size-3.5" />
              {s}
            </button>
          ))}
        </div>

        <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/60 p-1">
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
            (
              { discipline, performances: perfs, best, seasonBest, unit, chartData, domain, ticks },
              i
            ) => {
              const isOpen = openDiscipline === discipline
              const lowerBetter = isLowerBetter(unit)
              const color = colorForDiscipline(discipline, disciplineColors)
              return (
                <motion.div
                  key={discipline}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
                  className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:shadow-none"
                  style={
                    color
                      ? {
                          borderLeftWidth: 3,
                          borderLeftColor: color,
                          backgroundColor: `color-mix(in srgb, ${color} ${isLight ? 16 : 14}%, var(--card))`,
                        }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpenDiscipline(isOpen ? null : discipline)}
                    aria-expanded={isOpen}
                    className="relative flex w-full items-center gap-3 overflow-hidden p-4 text-left transition-colors hover:bg-foreground/[0.03]"
                  >
                    {/* Pictogramme desktop : colonne à largeur fixe tout à gauche de la
                        card — toujours à la même position d'un bandeau à l'autre (pas
                        d'absolute qui dérive selon la largeur du nom ou des stats).
                        Correctif 2026-08-26ter : déplacé de entre nom/stats vers la
                        gauche de la card, à la demande de Maksen. */}
                    {color && (
                      <div className="hidden h-10 w-14 shrink-0 items-center justify-center overflow-hidden sm:flex">
                        <DisciplinePictogram
                          discipline={discipline}
                          className="h-10 w-14 opacity-60"
                          style={{ color }}
                        />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      >
                        <ChevronDown className="size-3.5" />
                      </motion.span>
                      {color && (
                        <span
                          aria-hidden
                          className="relative size-2.5 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                      )}
                      <div className="relative min-w-0 overflow-hidden">
                        {/* Pictogramme mobile : en filigrane derrière le nom (pas de place à
                            droite sur petit écran, masqué par les stats sinon). */}
                        {color && (
                          <DisciplinePictogram
                            discipline={discipline}
                            className="pointer-events-none absolute top-1/2 left-0 h-8 w-auto -translate-y-1/2 opacity-[0.25] sm:hidden"
                            style={{ color }}
                          />
                        )}
                        <div className="relative truncate font-bold">
                          {formatDiscipline(discipline)}
                        </div>
                        <div className="relative truncate text-xs text-muted-foreground">
                          {perfs.length} performance{perfs.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          SB
                        </div>
                        {seasonBest ? (
                          <span
                            className={cn('text-base font-extrabold whitespace-nowrap', SILVER)}
                          >
                            {formatPerformanceValue(seasonBest.value, seasonBest.unit)}
                          </span>
                        ) : (
                          <span className="text-base font-extrabold text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          PB
                        </div>
                        <span
                          className="text-base font-extrabold whitespace-nowrap"
                          style={GOLD_STYLE}
                        >
                          {formatPerformanceValue(best.value, best.unit)}
                        </span>
                      </div>
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
                          {perfs.map((perf, idx) => {
                            const isSB = seasonBestIds.has(perf.id) && !perf.isPersonalBest
                            const { seasonShort } = computeSeason(perf.recordedAt)
                            return (
                              <motion.div
                                key={perf.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2, delay: Math.min(idx, 12) * 0.02 }}
                                className="px-4 py-3"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'w-5 shrink-0 text-right text-[9px] font-extrabold',
                                      !perf.isPersonalBest && isSB ? SILVER : ''
                                    )}
                                    style={perf.isPersonalBest ? GOLD_STYLE : undefined}
                                  >
                                    {perf.isPersonalBest ? 'PB' : isSB ? 'SB' : ''}
                                  </span>
                                  <span className="w-14 shrink-0 font-mono text-sm font-bold whitespace-nowrap tabular-nums">
                                    {formatPerformanceValue(perf.value, perf.unit)}
                                  </span>
                                  <span className="w-9 shrink-0">
                                    {perf.isIndoor !== null && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'h-4 px-1 text-[8px]',
                                          perf.isIndoor
                                            ? 'border-transparent bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                                            : 'border-transparent bg-[var(--chart-3)]/15 text-[var(--chart-3)]'
                                        )}
                                      >
                                        {perf.isIndoor ? 'IN' : 'OUT'}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="flex flex-1 items-center gap-1 font-mono text-xs text-muted-foreground">
                                    {perf.wind && (
                                      <>
                                        <Wind className="size-3.5 shrink-0" />
                                        {formatWind(perf.wind)}
                                      </>
                                    )}
                                  </span>
                                  <div className="flex w-16 shrink-0 items-center justify-end gap-1">
                                    {perf.level && (
                                      <>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'h-4.5 shrink-0 px-1 text-[9px]',
                                            levelStyle(perf.level)
                                          )}
                                        >
                                          {perf.level}
                                        </Badge>
                                        {perf.levelPoints !== null && (
                                          <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
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
                              </motion.div>
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
                                            !perf.isPersonalBest && isSB ? SILVER : ''
                                          )}
                                          style={perf.isPersonalBest ? GOLD_STYLE : undefined}
                                        >
                                          {perf.isPersonalBest ? 'PB' : isSB ? 'SB' : ''}
                                        </span>
                                        <span className="w-16 shrink-0 font-mono font-bold whitespace-nowrap tabular-nums">
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
                </motion.div>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}
