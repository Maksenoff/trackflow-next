export type CalendarCell = { date: Date; day: number; inMonth: boolean }

/** Date locale au format YYYY-MM-DD, sans décalage de fuseau horaire (pour <input type="date">). */
export function toDateInputValue(date: Date): string {
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

/** Grille de semaines (lundi -> dimanche) couvrant le mois donné, avec débordement des mois voisins. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1)
  const startWeekday = (first.getDay() + 6) % 7 // 0 = lundi
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: CalendarCell[] = []

  for (let i = startWeekday; i > 0; i--) {
    const d = new Date(year, month - 1, 1 - i)
    cells.push({ date: d, day: d.getDate(), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    cells.push({ date, day: d, inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    cells.push({ date: next, day: next.getDate(), inMonth: false })
  }

  return cells
}

/** Les 7 jours (lundi -> dimanche) de la semaine contenant `anchor`. */
export function buildWeekGrid(anchor: Date): CalendarCell[] {
  const weekday = (anchor.getDay() + 6) % 7 // 0 = lundi
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - weekday)

  const month = anchor.getMonth()
  const cells: CalendarCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    cells.push({ date: d, day: d.getDate(), inMonth: d.getMonth() === month })
  }
  return cells
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** "1 - 7 sept. 2026" ou "29 sept. - 5 oct. 2026" si la semaine chevauche deux mois. */
export function weekLabel(anchor: Date): string {
  const cells = buildWeekGrid(anchor)
  const start = cells[0].date
  const end = cells[6].date
  const shortMonths = FR_MONTHS.map((m) => m.slice(0, 3).replace(/^./, (c) => c))
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${start.getDate()} - ${end.getDate()} ${shortMonths[start.getMonth()]}. ${start.getFullYear()}`
  }
  return `${start.getDate()} ${shortMonths[start.getMonth()]}. - ${end.getDate()} ${shortMonths[end.getMonth()]}. ${end.getFullYear()}`
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const FR_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export function monthLabel(year: number, month: number): string {
  return `${FR_MONTHS[month - 1]} ${year}`
}

export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  let m = month + delta
  let y = year
  while (m < 1) {
    m += 12
    y--
  }
  while (m > 12) {
    m -= 12
    y++
  }
  return { year: y, month: m }
}
