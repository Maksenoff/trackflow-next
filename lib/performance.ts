// Logique de performance portée depuis Performance.php / PerformanceRepository.php (repo Symfony)

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

/** Formatte un nom de discipline (ex: "100m-haies" -> "100m Haies") */
export function formatDiscipline(discipline: string): string {
  return discipline
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => (/^[a-zA-Z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
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

  const diffStr = lowerBetter
    ? sign +
      (diff >= 60
        ? `${Math.floor(diff / 60)}:${(diff % 60).toFixed(2).padStart(5, '0')}`
        : `${diff.toFixed(2)}s`)
    : `${sign}${diff.toFixed(2)} ${perf.unit}`

  return { improved, diff: diffStr }
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
