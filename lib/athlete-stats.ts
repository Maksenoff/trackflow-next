// Logique portée depuis AthleteController::stats() + templates/athlete/stats.html.twig (repo Symfony)

import {
  computeSeason,
  formatDiffAbs,
  formatPerformanceValue,
  isLowerBetter,
} from '@/lib/performance'

export type RawPerf = {
  id: string
  discipline: string
  value: number
  unit: string
  recordedAt: Date
  isCompetition: boolean
  isIndoor: boolean | null
  wind: string | null
}

export type StatPerfPoint = {
  value: number
  formatted: string
  date: string
  dateRaw: string
  /** Année de départ de la saison (ex: 2024 pour la saison 2024-25), pas l'année civile. */
  seasonStart: number
  isComp: boolean
  isIndoor: boolean
  wind: number | null
}

export type WindPoint = {
  wind: number
  value: number
  formatted: string
  date: string
  isComp: boolean
}

export type DisciplineStats = {
  unit: string
  lower: boolean
  count: number
  first: { formatted: string; date: string }
  last: { formatted: string; date: string }
  pb: { formatted: string; date: string; value: number }
  progression: {
    abs: number
    formatted: string | null
    improved: boolean | null
    months: number
  }
  consistency: { score: number; stdDev: number; cv: number }
  wind: WindPoint[]
  bestLegal: { formatted: string; wind: number; date: string } | null
  bins: { label: string; count: number }[]
  chart: { labels: string[]; values: number[]; isComp: boolean[] }
  rawPerfs: StatPerfPoint[]
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseWind(raw: string | null): number | null {
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Bins d'histogramme à pas "sport-specific". Reproduit _computeBins (stats.html.twig) */
export function computeBins(values: number[], unit: string): { label: string; count: number }[] {
  if (values.length < 3) return []
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  if (maxV <= minV) return []

  const baseStep =
    isLowerBetter(unit) || unit === 'm'
      ? 0.1
      : unit === 'kg'
        ? 1
        : unit === 'pts'
          ? 50
          : (maxV - minV) / 8

  let step = baseStep
  while ((maxV - minV) / step > 14) step *= 2
  const decimals = step < 1 ? 2 : step < 10 ? 1 : 0
  const lo0 = Math.floor(minV / step) * step
  const suffix = isLowerBetter(unit) ? 's' : unit === 'm' ? 'm' : ''

  const bins: { label: string; count: number }[] = []
  for (let b = 0; ; b++) {
    const lo = Math.round((lo0 + b * step) * 1e6) / 1e6
    const hi = Math.round((lo + step) * 1e6) / 1e6
    if (lo > maxV) break
    const isLast = hi > maxV
    const n = values.filter((v) => v >= lo && (isLast ? v <= maxV : v < hi)).length
    bins.push({ label: `${lo.toFixed(decimals)}${suffix}`, count: n })
  }
  while (bins.length && bins[0].count === 0) bins.shift()
  while (bins.length && bins[bins.length - 1].count === 0) bins.pop()
  return bins
}

/** Moyenne mobile pour la courbe de progression. Reproduit _buildProgression (stats.html.twig) */
export function computeMovingAverage(values: number[]): number[] {
  const win = values.length > 20 ? 5 : 3
  return values.map((_, i) => {
    const from = Math.max(0, i - win + 1)
    const slice = values.slice(from, i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

/** Stats complètes d'une discipline (toutes perfs, ou sous-ensemble déjà filtré par année). */
export function computeDisciplineStats(perfs: RawPerf[]): DisciplineStats {
  const sorted = [...perfs].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
  const unit = sorted[0].unit
  const lower = isLowerBetter(unit)
  const values = sorted.map((p) => p.value)
  const count = sorted.length
  const first = sorted[0]
  const last = sorted[count - 1]

  const bestValue = lower ? Math.min(...values) : Math.max(...values)
  const bestPerf = sorted[values.indexOf(bestValue)]

  const rawDiff = bestValue - first.value
  const improved = lower ? rawDiff < 0 : rawDiff > 0
  const days =
    count > 1 ? (bestPerf.recordedAt.getTime() - first.recordedAt.getTime()) / 86400000 : 0
  const months = days > 0 ? Math.round((days / 30.5) * 10) / 10 : 0

  const mean = values.reduce((a, b) => a + b, 0) / count
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / count
  const stdDev = Math.sqrt(variance)
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0
  const score = Math.max(0, Math.min(100, Math.round(100 - cv * 15)))

  // Vent — on exclut l'indoor, et on ne garde que la meilleure perf à vent nul (0.0)
  const windRaw = sorted.filter((p) => p.wind !== null && !p.isIndoor)
  let bestAtZero: RawPerf | null = null
  const windFiltered: RawPerf[] = []
  for (const p of windRaw) {
    const w = parseWind(p.wind)
    if (w === 0) {
      if (!bestAtZero || (lower ? p.value < bestAtZero.value : p.value > bestAtZero.value)) {
        bestAtZero = p
      }
    } else {
      windFiltered.push(p)
    }
  }
  if (bestAtZero) windFiltered.push(bestAtZero)
  const windData: WindPoint[] = windFiltered.map((p) => ({
    wind: parseWind(p.wind) ?? 0,
    value: p.value,
    formatted: formatPerformanceValue(p.value, unit),
    date: fmtDate(p.recordedAt),
    isComp: p.isCompetition,
  }))

  const legalPerfs = windData.filter((p) => Math.abs(p.wind) <= 2.0)
  const bestLegal = legalPerfs.length
    ? legalPerfs.reduce((best, p) =>
        !best || (lower ? p.value < best.value : p.value > best.value) ? p : best
      )
    : null

  return {
    unit,
    lower,
    count,
    first: {
      formatted: formatPerformanceValue(first.value, unit),
      date: fmtDate(first.recordedAt),
    },
    last: { formatted: formatPerformanceValue(last.value, unit), date: fmtDate(last.recordedAt) },
    pb: {
      formatted: formatPerformanceValue(bestValue, unit),
      date: fmtDate(bestPerf.recordedAt),
      value: bestValue,
    },
    progression: {
      abs: Math.abs(rawDiff),
      formatted: count > 1 ? formatDiffAbs(Math.abs(rawDiff), unit) : null,
      improved: count > 1 ? improved : null,
      months,
    },
    consistency: {
      score,
      stdDev: Math.round(stdDev * 1000) / 1000,
      cv: Math.round(cv * 100) / 100,
    },
    wind: windData,
    bestLegal: bestLegal
      ? { formatted: bestLegal.formatted, wind: bestLegal.wind, date: bestLegal.date }
      : null,
    bins: computeBins(values, unit),
    chart: {
      labels: sorted.map((p) => p.recordedAt.toISOString().slice(0, 10)),
      values,
      isComp: sorted.map((p) => p.isCompetition),
    },
    rawPerfs: sorted.map((p) => ({
      value: p.value,
      formatted: formatPerformanceValue(p.value, unit),
      date: fmtDate(p.recordedAt),
      dateRaw: p.recordedAt.toISOString().slice(0, 10),
      seasonStart: computeSeason(p.recordedAt).seasonStart,
      isComp: p.isCompetition,
      isIndoor: p.isIndoor === true,
      wind: parseWind(p.wind),
    })),
  }
}

export type VsPB = {
  isNewPB: boolean
  formatted: string
  improved: boolean
  refFormatted: string
  refDate: string
}

/** SB de la saison sélectionnée vs meilleur PB des saisons précédentes. Reproduit `d.vsPB` (stats.html.twig) */
export function computeVsPB(
  rawPerfs: StatPerfPoint[],
  unit: string,
  lower: boolean,
  seasonStart: number
): VsPB | null {
  const yearPerfs = rawPerfs.filter((p) => p.seasonStart === seasonStart)
  if (!yearPerfs.length) return null
  const yearBest = lower
    ? Math.min(...yearPerfs.map((p) => p.value))
    : Math.max(...yearPerfs.map((p) => p.value))

  const prevYearPerfs = rawPerfs.filter((p) => p.seasonStart < seasonStart)
  if (!prevYearPerfs.length) return null
  const prevPB = lower
    ? Math.min(...prevYearPerfs.map((p) => p.value))
    : Math.max(...prevYearPerfs.map((p) => p.value))
  const prevPBPerf = prevYearPerfs.find((p) => p.value === prevPB)
  const diff = yearBest - prevPB
  const improved = lower ? diff < 0 : diff > 0
  const isNewPB = lower ? yearBest <= prevPB + 1e-9 : yearBest >= prevPB - 1e-9

  return {
    isNewPB,
    formatted: formatDiffAbs(Math.abs(diff), unit),
    improved,
    refFormatted: formatPerformanceValue(prevPB, unit),
    refDate: prevPBPerf?.date ?? '',
  }
}

export type VsSbPrevYear = {
  formatted: string
  improved: boolean
  prevFormatted: string
  prevSeasonStart: number
}

/** SB de la saison sélectionnée vs SB de la saison précédente. Reproduit `d.vsSbPrevYear` */
export function computeVsSbPrevYear(
  rawPerfs: StatPerfPoint[],
  unit: string,
  lower: boolean,
  seasonStart: number
): VsSbPrevYear | null {
  const yearPerfs = rawPerfs.filter((p) => p.seasonStart === seasonStart)
  if (!yearPerfs.length) return null
  const yearBest = lower
    ? Math.min(...yearPerfs.map((p) => p.value))
    : Math.max(...yearPerfs.map((p) => p.value))

  const prevSeasonStart = seasonStart - 1
  const prevYearVals = rawPerfs.filter((p) => p.seasonStart === prevSeasonStart).map((p) => p.value)
  if (!prevYearVals.length) return null
  const prevSB = lower ? Math.min(...prevYearVals) : Math.max(...prevYearVals)
  const diff = yearBest - prevSB
  const improved = lower ? diff < 0 : diff > 0

  return {
    formatted: formatDiffAbs(Math.abs(diff), unit),
    improved,
    prevFormatted: formatPerformanceValue(prevSB, unit),
    prevSeasonStart,
  }
}

/** Formate une année de départ de saison en libellé court (ex: 2024 → "2024-25"). */
export function seasonLabel(seasonStart: number): string {
  return `${seasonStart}-${String(seasonStart + 1).slice(2)}`
}

export function consistencyLabel(score: number): string {
  if (score >= 80) return 'Très régulier'
  if (score >= 60) return 'Régulier'
  if (score >= 40) return 'Irrégulier'
  return 'Très irrégulier'
}

export function consistencyColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-blue-600 dark:text-blue-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

export function consistencyBarClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}
