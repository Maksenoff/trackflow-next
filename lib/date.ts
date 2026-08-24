const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysUntil(date: Date): number {
  return Math.ceil((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY_MS)
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${h}h${String(rem).padStart(2, '0')}` : `${h}h`
}

/** "Aujourd'hui" / "Demain" / "dans Nj" — reproduit la logique des templates dashboard Symfony */
export function relativeDayLabel(date: Date): {
  label: string
  tone: 'today' | 'tomorrow' | 'future'
} {
  const diff = daysUntil(date)
  if (diff === 0) return { label: "Aujourd'hui", tone: 'today' }
  if (diff === 1) return { label: 'Demain', tone: 'tomorrow' }
  return { label: `dans ${diff}j`, tone: 'future' }
}

/** Version courte "Auj." / "Dem." / "dd/mm" pour les listes compactes */
export function relativeDayShort(date: Date): {
  label: string
  tone: 'today' | 'tomorrow' | 'future'
} {
  const diff = daysUntil(date)
  if (diff === 0) return { label: 'Auj.', tone: 'today' }
  if (diff === 1) return { label: 'Dem.', tone: 'tomorrow' }
  return { label: formatShortDate(date), tone: 'future' }
}
