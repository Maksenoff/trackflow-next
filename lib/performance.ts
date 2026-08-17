// Logique de performance portée depuis Performance.php / PerformanceRepository.php (repo Symfony)

import { DISCIPLINE_LABELS } from '@/lib/disciplines'

const LOWER_IS_BETTER_UNITS = ['s', 'min:s']

export function isLowerBetter(unit: string): boolean {
  return LOWER_IS_BETTER_UNITS.includes(unit)
}

/** Reproduit Performance::getFormattedValue() */
export function formatPerformanceValue(value: number, unit: string): string {
  if (isLowerBetter(unit)) {
    if (value >= 60) {
      const min = Math.floor(value / 60)
      const sec = value - min * 60
      return `${min}:${sec.toFixed(2).padStart(5, '0')}`
    }
    return `${value.toFixed(2)} s`
  }
  const n = value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return `${n} ${unit}`
}

/** Formatte un nom de discipline en libellé lisible (ex: "poids-7kg" -> "Lancer de poids (7kg)") */
export function formatDiscipline(discipline: string): string {
  if (DISCIPLINE_LABELS[discipline]) return DISCIPLINE_LABELS[discipline]
  return discipline
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => (/^[a-zA-Z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** Saison sept->août, ex: {season: "2025-2026", seasonShort: "2025-26"}. Reproduit AthleteController::show() */
export function computeSeason(date: Date): {
  season: string
  seasonShort: string
  seasonStart: number
} {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const seasonStart = month >= 9 ? year : year - 1
  return {
    season: `${seasonStart}-${seasonStart + 1}`,
    seasonShort: `${seasonStart}-${String(seasonStart + 1).slice(2)}`,
    seasonStart,
  }
}

/** Catégorie FFA (âge au 31/12 de l'année de la perf). Reproduit AthleteController::show() */
export function computeCategory(recordedAt: Date, birthDate: Date | null): string | null {
  if (!birthDate) return null
  const age = recordedAt.getFullYear() - birthDate.getFullYear()
  if (age <= 11) return 'Poussin'
  if (age <= 13) return 'Benjamin'
  if (age <= 15) return 'Minime'
  if (age <= 17) return 'Cadet'
  if (age <= 19) return 'Junior'
  if (age <= 22) return 'Espoir'
  if (age <= 34) return 'Senior'
  return 'Master'
}

/**
 * Domaine + ticks "ronds" pour l'axe des perfs d'un graphique (ex: 6.10, 6.20...
 * plutôt que les valeurs brutes 6.18, 6.61). La valeur exacte reste visible au survol.
 */
export function computeNiceAxis(
  values: number[],
  targetTicks = 5
): { domain: [number, number]; ticks: number[] } {
  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || Math.max(min * 0.1, 1)
  const rawStep = range / targetTicks
  const exponent = Math.floor(Math.log10(rawStep))
  const magnitude = 10 ** exponent
  const residual = rawStep / magnitude
  const niceResidual = residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1
  const step = niceResidual * magnitude
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step

  const ticks: number[] = []
  for (let t = niceMin; t <= niceMax + step / 2; t += step) {
    ticks.push(Math.round(t * 1e6) / 1e6)
  }
  return { domain: [niceMin, niceMax], ticks }
}

/** Formatte un écart absolu (sans signe), ex: "0.23s" ou "0.24 m". Reproduit $formatDiff (AthleteController::stats) */
export function formatDiffAbs(abs: number, unit: string): string {
  if (isLowerBetter(unit)) {
    if (abs >= 60) {
      const min = Math.floor(abs / 60)
      return `${min}:${(abs - min * 60).toFixed(2).padStart(5, '0')}`
    }
    return `${abs.toFixed(2)}s`
  }
  return `${abs.toFixed(2)} ${unit}`
}

export type Trend = { improved: boolean | null; diff: string }

type PerfLike = { value: number; unit: string }

/** Reproduit la closure $calcDiff du DashboardController */
export function calcTrend(perf: PerfLike, prev: PerfLike | null): Trend | null {
  if (!prev) return null
  const curr = perf.value
  const prevVal = prev.value
  if (curr === prevVal) return { improved: null, diff: '=' }

  const lowerBetter = isLowerBetter(perf.unit)
  const improved = lowerBetter ? curr < prevVal : curr > prevVal
  const diff = Math.abs(curr - prevVal)
  const sign = improved ? (lowerBetter ? '-' : '+') : lowerBetter ? '+' : '-'

  return { improved, diff: sign + formatDiffAbs(diff, perf.unit) }
}

type PerfWithDate = {
  id: string
  discipline: string
  value: number
  unit: string
  recordedAt: Date
}

/**
 * Meilleur résultat de la saison athlétique en cours (1er septembre -> 31 août)
 * par discipline. Reproduit PerformanceRepository::findSeasonBestsByAthlete().
 */
export function computeSeasonBests<T extends PerfWithDate>(performances: T[]): Map<string, T> {
  const now = new Date()
  const seasonStartYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1
  const seasonStart = new Date(seasonStartYear, 8, 1) // mois 8 = septembre (0-index)

  const bests = new Map<string, T>()
  for (const perf of performances) {
    if (perf.recordedAt < seasonStart) continue
    const current = bests.get(perf.discipline)
    if (!current) {
      bests.set(perf.discipline, perf)
      continue
    }
    const improved = isLowerBetter(perf.unit)
      ? perf.value < current.value
      : perf.value > current.value
    if (improved) bests.set(perf.discipline, perf)
  }
  return bests
}
