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

// timeZone: 'UTC' — l'heure est stockée en UTC "naïf" (juste l'heure murale saisie,
// jamais une vraie conversion de fuseau, voir app/api/sessions/route.ts). Sans ça,
// l'affichage réapplique le décalage local du serveur/navigateur par-dessus (ex :
// 19h saisi qui s'affichait 21h).
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

const CLUB_TIMEZONE = 'Europe/Paris'

/**
 * Décalage (en minutes) entre Europe/Paris et UTC pour une date donnée (gère
 * automatiquement le passage heure d'été/hiver). Sert uniquement à convertir
 * entre l'heure "murale naïve" stockée (chiffres saisis, écrits avec un Z
 * littéral — voir app/api/sessions/route.ts) et le véritable instant réel :
 * indispensable pour tout calcul de temps écoulé/restant (rappels, fenêtres
 * de cron), jamais pour l'affichage (qui reste en `timeZone: 'UTC'`, voir
 * `formatTime` ci-dessus — sinon on réintroduit le bug d'origine).
 */
function parisOffsetMinutes(date: Date): number {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TIMEZONE,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(part ?? '')
  if (!match) return 60
  const sign = match[1].startsWith('-') ? -1 : 1
  const hours = Math.abs(Number(match[1]))
  const minutes = match[2] ? Number(match[2]) : 0
  return sign * (hours * 60 + minutes)
}

/**
 * Convertit une heure murale naïve stockée (ex : `startTime` d'une séance,
 * chiffres UTC littéraux = heure de Paris saisie par l'athlète/coach) en
 * instant réel — seule base valable pour comparer à `Date.now()`/`new Date()`.
 */
export function naiveToRealInstant(naive: Date): Date {
  return new Date(naive.getTime() - parisOffsetMinutes(naive) * 60_000)
}

/**
 * Inverse de `naiveToRealInstant` — convertit un instant réel (typiquement
 * `new Date()`) dans le même espace "naïf" que les champs stockés, pour
 * comparer directement en base (ex: fenêtre de cron) sans reconvertir
 * chaque ligne individuellement.
 */
export function realInstantToNaive(real: Date): Date {
  return new Date(real.getTime() + parisOffsetMinutes(real) * 60_000)
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
