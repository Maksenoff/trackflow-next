// Logique de debrief des séances — règle métier définie par le coach (pas de portage Symfony ici) :
// une séance devient debriefable le soir même à 20h30, et passe automatiquement en
// "non effectuée" si elle n'a toujours pas de ressenti 3 jours après cette ouverture.

export type DebriefStatus = 'upcoming' | 'to_debrief' | 'logged' | 'skipped' | 'auto_skipped'

const DEBRIEF_OPENS_HOUR = 20
const DEBRIEF_OPENS_MINUTE = 30
const AUTO_SKIP_AFTER_DAYS = 3

/** 20h30 le jour de la séance : avant, elle n'est pas encore debriefable. */
function debriefOpensAt(sessionDate: Date): Date {
  const d = new Date(sessionDate)
  d.setHours(DEBRIEF_OPENS_HOUR, DEBRIEF_OPENS_MINUTE, 0, 0)
  return d
}

export type SessionLog = { difficulty: number | null; skipped: boolean } | null | undefined

export function computeDebriefStatus(
  sessionDate: Date,
  log: SessionLog,
  now: Date = new Date()
): DebriefStatus {
  const opensAt = debriefOpensAt(sessionDate)
  if (now < opensAt) return 'upcoming'
  if (log?.skipped) return 'skipped'
  if (log && log.difficulty !== null) return 'logged'

  const autoSkipAt = new Date(opensAt)
  autoSkipAt.setDate(autoSkipAt.getDate() + AUTO_SKIP_AFTER_DAYS)
  if (now > autoSkipAt) return 'auto_skipped'
  return 'to_debrief'
}

export const DEBRIEF_STATUS_LABELS: Record<DebriefStatus, string> = {
  upcoming: 'À venir',
  to_debrief: 'À débriefer',
  logged: 'Faite',
  skipped: 'Non effectuée',
  auto_skipped: 'Non effectuée',
}
