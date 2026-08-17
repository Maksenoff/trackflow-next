'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  CalendarRange,
  Layers,
  Medal,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react'
import {
  computeDisciplineStats,
  computeMovingAverage,
  computeVsPB,
  computeVsSbPrevYear,
  consistencyBarClass,
  consistencyColorClass,
  consistencyLabel,
  seasonLabel,
  type DisciplineStats,
  type RawPerf,
} from '@/lib/athlete-stats'
import {
  computeNiceAxis,
  computeSeason,
  formatDiscipline,
  formatPerformanceValue,
} from '@/lib/performance'
import { formatFullDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { InfoHint } from './info-hint'

const GOLD =
  'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent'
const SILVER =
  'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent'

export function StatsAdvancedView({
  perfs,
  disciplines,
}: {
  perfs: RawPerf[]
  disciplines: string[]
}) {
  const [activeDiscipline, setActiveDiscipline] = useState(disciplines[0])
  const [activeSeason, setActiveSeason] = useState<'all' | number>('all')

  const perfsByDiscipline = useMemo(() => {
    const map = new Map<string, RawPerf[]>()
    for (const p of perfs) {
      const list = map.get(p.discipline) ?? []
      list.push(p)
      map.set(p.discipline, list)
    }
    return map
  }, [perfs])

  const disciplinePerfs = useMemo(
    () => perfsByDiscipline.get(activeDiscipline) ?? [],
    [perfsByDiscipline, activeDiscipline]
  )
  const baseStats = useMemo(() => computeDisciplineStats(disciplinePerfs), [disciplinePerfs])

  const availableSeasons = useMemo(
    () => Array.from(new Set(baseStats.rawPerfs.map((p) => p.seasonStart))).sort((a, b) => b - a),
    [baseStats]
  )

  const activeStats: DisciplineStats = useMemo(() => {
    if (activeSeason === 'all') return baseStats
    const seasonPerfs = disciplinePerfs.filter(
      (p) => computeSeason(p.recordedAt).seasonStart === activeSeason
    )
    return seasonPerfs.length ? computeDisciplineStats(seasonPerfs) : baseStats
  }, [activeSeason, baseStats, disciplinePerfs])

  const vsPB = useMemo(
    () =>
      activeSeason === 'all'
        ? null
        : computeVsPB(baseStats.rawPerfs, baseStats.unit, baseStats.lower, activeSeason),
    [activeSeason, baseStats]
  )
  const vsSbPrevYear = useMemo(
    () =>
      activeSeason === 'all'
        ? null
        : computeVsSbPrevYear(baseStats.rawPerfs, baseStats.unit, baseStats.lower, activeSeason),
    [activeSeason, baseStats]
  )

  function switchDiscipline(disc: string) {
    setActiveDiscipline(disc)
    const seasons = new Set(
      (perfsByDiscipline.get(disc) ?? []).map((p) => computeSeason(p.recordedAt).seasonStart)
    )
    if (activeSeason !== 'all' && !seasons.has(activeSeason)) setActiveSeason('all')
  }

  const chartData = activeStats.chart.labels.map((label, i) => ({
    date: label,
    value: activeStats.chart.values[i],
    isComp: activeStats.chart.isComp[i],
  }))
  const movingAvg = computeMovingAverage(activeStats.chart.values)
  const chartDataWithMa = chartData.map((d, i) => ({ ...d, ma: movingAvg[i] }))
  const { domain: yDomain, ticks: yTicks } = computeNiceAxis(activeStats.chart.values)

  return (
    <div className="space-y-4">
      {/* Discipline tabs */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {disciplines.map((disc) => {
          const count = (perfsByDiscipline.get(disc) ?? []).length
          const active = disc === activeDiscipline
          return (
            <button
              key={disc}
              type="button"
              onClick={() => switchDiscipline(disc)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {formatDiscipline(disc)} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Season filter */}
      {availableSeasons.length > 1 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs text-muted-foreground">Saison :</span>
          <button
            type="button"
            onClick={() => setActiveSeason('all')}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              activeSeason === 'all'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="size-3.5" />
            Toutes
          </button>
          {availableSeasons.map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => setActiveSeason(season)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                activeSeason === season
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarRange className="size-3.5" />
              {seasonLabel(season)}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="vs PB"
          info="Écart entre ton meilleur résultat de la saison sélectionnée et ton record personnel (PB), toutes saisons confondues."
          body={
            activeSeason === 'all' ? (
              <EmptyCardHint>Sélectionne une saison.</EmptyCardHint>
            ) : vsPB ? (
              <div>
                <DiffValue
                  improved={vsPB.improved}
                  lower={baseStats.lower}
                  formatted={vsPB.formatted}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {vsPB.isNewPB
                    ? `★ Nouveau PB · vs ancien (${vsPB.refFormatted})`
                    : `écart au PB · (${vsPB.refFormatted})`}
                </p>
              </div>
            ) : (
              <EmptyCardHint>Première saison — pas d&apos;historique.</EmptyCardHint>
            )
          }
        />

        <StatCard
          icon={TrendingDown}
          label="vs SB"
          info="Écart entre ton meilleur résultat (SB) de la saison sélectionnée et celui de la saison précédente."
          body={
            activeSeason === 'all' ? (
              <EmptyCardHint>Sélectionne une saison.</EmptyCardHint>
            ) : vsSbPrevYear ? (
              <div>
                <DiffValue
                  improved={vsSbPrevYear.improved}
                  lower={baseStats.lower}
                  formatted={vsSbPrevYear.formatted}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  vs SB {seasonLabel(vsSbPrevYear.prevSeasonStart)} · ({vsSbPrevYear.prevFormatted})
                </p>
              </div>
            ) : (
              <EmptyCardHint>Pas de SB saison précédente.</EmptyCardHint>
            )
          }
        />

        <StatCard
          icon={Medal}
          label="SB & PB"
          info="SB = meilleur résultat de la saison sélectionnée. PB = record personnel toutes saisons confondues. Une pastille dorée marque un nouveau record."
          body={
            activeSeason !== 'all' ? (
              <div className="space-y-2.5">
                <LabeledValue tag="SB" value={activeStats.pb.formatted} valueClassName={SILVER} />
                {vsPB?.isNewPB ? (
                  <div>
                    <LabeledValue
                      tag="PB"
                      value={`${activeStats.pb.formatted} ★`}
                      valueClassName={GOLD}
                    />
                    <p className="mt-1 pl-7 text-[11px] text-muted-foreground">
                      ex-PB : {vsPB.refFormatted} ({vsPB.refDate})
                    </p>
                  </div>
                ) : (
                  <LabeledValue
                    tag="PB"
                    value={vsPB ? vsPB.refFormatted : baseStats.pb.formatted}
                    valueClassName={GOLD}
                  />
                )}
              </div>
            ) : (
              <LabeledValue tag="PB" value={baseStats.pb.formatted} valueClassName={GOLD} />
            )
          }
        />

        <StatCard
          icon={Activity}
          label="Régularité"
          info="Score basé sur la dispersion de tes performances (écart-type / coefficient de variation) : plus tes résultats sont proches les uns des autres, plus le score est élevé."
          body={
            <div>
              <p
                className={cn(
                  'font-mono text-xl leading-none font-bold',
                  consistencyColorClass(activeStats.consistency.score)
                )}
              >
                {activeStats.consistency.score} / 100
              </p>
              <p
                className={cn(
                  'mt-2 text-[11px]',
                  consistencyColorClass(activeStats.consistency.score)
                )}
              >
                {consistencyLabel(activeStats.consistency.score)}
              </p>
            </div>
          }
        />
      </div>

      {/* Progression chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Progression</h2>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {activeStats.chart.isComp.some((c) => !c) && (
              <LegendDot color="var(--chart-1)" label="Entraînement" />
            )}
            <LegendDot color="var(--chart-3)" label="Compétition" />
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-muted-foreground/50" />
              Moy. mobile
            </span>
          </div>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataWithMa} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(v: string) => v.slice(5).split('-').reverse().join('/')}
              />
              <YAxis
                reversed={activeStats.lower}
                width={52}
                domain={yDomain}
                ticks={yTicks}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatPerformanceValue(v, activeStats.unit)}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={<ProgressionTooltip unit={activeStats.unit} />}
              />
              <Line
                type="monotone"
                dataKey="ma"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(props: {
                  cx?: number
                  cy?: number
                  payload?: { isComp: boolean }
                  index?: number
                }) => (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={3.5}
                    fill={props.payload?.isComp ? 'var(--chart-3)' : 'var(--chart-1)'}
                    stroke="none"
                  />
                )}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consistance + Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-5 flex items-center gap-1.5 text-sm font-bold">
            Consistance
            <InfoHint>
              Mesure la régularité de tes performances dans cette discipline : un écart-type et un
              coefficient de variation faibles indiquent des résultats proches les uns des autres
              d&apos;une compétition à l&apos;autre.
            </InfoHint>
          </h2>

          <div className="mb-5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Score de régularité</span>
              <span
                className={cn(
                  'font-mono text-sm font-bold',
                  consistencyColorClass(activeStats.consistency.score)
                )}
              >
                {activeStats.consistency.score} / 100
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  consistencyBarClass(activeStats.consistency.score)
                )}
                style={{ width: `${activeStats.consistency.score}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>Très irrégulier</span>
              <span>Très régulier</span>
            </div>
          </div>

          <div className="divide-y divide-border border-t border-border text-sm">
            <StatRow
              label="Interprétation"
              value={
                <span className={consistencyColorClass(activeStats.consistency.score)}>
                  {consistencyLabel(activeStats.consistency.score)}
                </span>
              }
            />
            <StatRow
              label="Écart-type"
              value={`${activeStats.consistency.stdDev} ${activeStats.unit}`}
            />
            <StatRow label="Coeff. de variation" value={`${activeStats.consistency.cv} %`} />
            <StatRow label="Nombre de performances" value={activeStats.count} />
            <StatRow
              label="Première perf"
              value={
                <span className="flex flex-col items-end gap-0.5">
                  <span className="font-mono">{activeStats.first.formatted}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {activeStats.first.date}
                  </span>
                </span>
              }
            />
            <StatRow
              label="Dernière perf"
              value={
                <span className="flex flex-col items-end gap-0.5">
                  <span className="font-mono">{activeStats.last.formatted}</span>
                  <span className="text-[11px] text-muted-foreground">{activeStats.last.date}</span>
                </span>
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-5 flex items-center gap-1.5 text-sm font-bold">
            Distribution des résultats
            <InfoHint>
              Nombre de performances regroupées par tranche de valeur, pour voir en un coup
              d&apos;œil où se concentrent tes résultats.
            </InfoHint>
          </h2>
          {activeStats.bins.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeStats.bins} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    width={28}
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                    content={<DistributionTooltip />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
              Pas assez de données (minimum 3 perfs)
            </div>
          )}
        </div>
      </div>

      {/* Wind impact */}
      {activeStats.wind.length >= 2 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold">
            <Wind className="size-4 text-muted-foreground" />
            Impact du vent
            <InfoHint>
              Un vent favorable ≤ 2.0 m/s rend la performance homologuable (records/classements).
              Au-delà, la perf reste affichée mais n&apos;est pas retenue comme référence.
            </InfoHint>
          </h2>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <WindTile label="Perfs relevées" value={String(activeStats.wind.length)} />
            <WindTile
              label="Meilleure légale (≤2.0)"
              value={activeStats.bestLegal ? activeStats.bestLegal.formatted : '—'}
              sub={
                activeStats.bestLegal
                  ? `${activeStats.bestLegal.wind} m/s · ${activeStats.bestLegal.date}`
                  : undefined
              }
              valueClassName={
                activeStats.bestLegal ? 'text-emerald-600 dark:text-emerald-400' : undefined
              }
            />
            <WindTile
              label="Vent moyen"
              value={`${(
                activeStats.wind.reduce((s, w) => s + w.wind, 0) / activeStats.wind.length
              ).toFixed(1)} m/s`}
            />
            <WindTile
              label="Vent max"
              value={`${Math.max(...activeStats.wind.map((w) => w.wind)).toFixed(1)} m/s`}
            />
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeStats.wind} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  width={40}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v} m/s`}
                />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
                <ReferenceLine y={2} stroke="var(--chart-3)" strokeDasharray="4 3" />
                <ReferenceLine y={-2} stroke="var(--chart-3)" strokeDasharray="4 3" />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  content={<WindChartTooltip />}
                />
                <Bar dataKey="wind" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {activeStats.wind.map((w, i) => (
                    <Cell
                      key={i}
                      fill={Math.abs(w.wind) <= 2 ? 'var(--chart-2)' : 'var(--chart-4)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Ligne grise = 0 · Lignes pointillées = limites légales ±2.0 m/s
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  info,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  info?: React.ReactNode
  body: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {info && <InfoHint>{info}</InfoHint>}
      </div>
      {body}
    </div>
  )
}

function DiffValue({
  improved,
  lower,
  formatted,
}: {
  improved: boolean
  lower: boolean
  formatted: string
}) {
  const sign = improved ? (lower ? '−' : '+') : lower ? '+' : '−'
  return (
    <p
      className={cn(
        'font-mono text-xl leading-none font-bold',
        improved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
      )}
    >
      {sign}
      {formatted}
    </p>
  )
}

function EmptyCardHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

function LabeledValue({
  tag,
  value,
  valueClassName,
}: {
  tag: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-6 shrink-0 text-[10px] font-semibold text-muted-foreground uppercase">
        {tag}
      </span>
      <span className={cn('font-mono text-xl leading-none font-bold', valueClassName)}>
        {value}
      </span>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  )
}

function TooltipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-36 rounded-xl border border-border bg-card px-3.5 py-3 text-xs shadow-xl shadow-black/10 dark:shadow-black/50">
      {children}
    </div>
  )
}

function TooltipRow({
  color,
  dashed,
  label,
  value,
  muted,
}: {
  color: string
  dashed?: boolean
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {dashed ? (
          <span
            className="inline-block w-2.5 border-t-2 border-dashed"
            style={{ borderColor: color }}
          />
        ) : (
          <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        )}
        {label}
      </span>
      <span
        className={cn('font-mono font-bold', muted ? 'text-muted-foreground' : 'text-foreground')}
      >
        {value}
      </span>
    </div>
  )
}

function ProgressionTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { dataKey?: string; value?: number; payload?: { isComp: boolean } }[]
  label?: string
  unit: string
}) {
  if (!active || !payload?.length || !label) return null
  const perfPoint = payload.find((p) => p.dataKey === 'value')
  const maPoint = payload.find((p) => p.dataKey === 'ma')
  const isComp = perfPoint?.payload?.isComp

  return (
    <TooltipCard>
      <div className="mb-2 font-bold text-foreground">{formatFullDate(new Date(label))}</div>
      <div className="space-y-0.5">
        {perfPoint?.value !== undefined && (
          <TooltipRow
            color={isComp ? 'var(--chart-3)' : 'var(--chart-1)'}
            label="Perf"
            value={formatPerformanceValue(perfPoint.value, unit)}
          />
        )}
        {maPoint?.value !== undefined && (
          <TooltipRow
            color="var(--muted-foreground)"
            dashed
            muted
            label="Moy. mobile"
            value={formatPerformanceValue(maPoint.value, unit)}
          />
        )}
      </div>
    </TooltipCard>
  )
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value?: number; payload?: { label: string; count: number } }[]
}) {
  if (!active || !payload?.length) return null
  const bin = payload[0].payload
  if (!bin) return null

  return (
    <TooltipCard>
      <div className="mb-2 font-bold text-foreground">{bin.label}</div>
      <TooltipRow color="var(--chart-1)" label="Performances" value={`${bin.count}`} />
    </TooltipCard>
  )
}

function WindChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: {
    value?: number
    payload?: { wind: number; formatted: string; date: string; isComp: boolean }
  }[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  if (!point) return null
  const legal = Math.abs(point.wind) <= 2

  return (
    <TooltipCard>
      <div className="mb-2 font-bold text-foreground">{point.date}</div>
      <div className="space-y-0.5">
        <TooltipRow
          color="var(--chart-1)"
          label={point.isComp ? 'Compétition' : 'Entraînement'}
          value={point.formatted}
        />
        <TooltipRow
          color={legal ? 'var(--chart-2)' : 'var(--chart-4)'}
          label="Vent"
          value={`${point.wind > 0 ? '+' : ''}${point.wind} m/s`}
        />
      </div>
    </TooltipCard>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function WindTile({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string
  value: string
  sub?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3.5">
      <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn('font-mono text-lg leading-none font-bold', valueClassName)}>{value}</p>
      {sub && <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
