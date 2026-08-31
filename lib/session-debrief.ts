// Logique de debrief des séances — règle métier définie par le coach (pas de portage Symfony ici) :
// une séance devient debriefable à l'heure de fin de la séance (heure de début + durée),
// ou à 21h le jour même si la durée n'est pas renseignée (ou 20h30 s'il n'y a pas d'heure
// du tout, ex. compétitions) — et passe automatiquement en "non effectuée" si elle n'a
// toujours pas de ressenti 3 jours après cette ouverture.

import { naiveToRealInstant } from '@/lib/date'

export type DebriefStatus = 'upcoming' | 'to_debrief' | 'logged' | 'skipped' | 'auto_skipped'

const NO_TIME_OPENS_HOUR = 20
const NO_TIME_OPENS_MINUTE = 30
const NO_DURATION_OPENS_HOUR = 21
const AUTO_SKIP_AFTER_DAYS = 3

/**
 * Heure d'ouverture du debrief, en instant réel. `startTime`/`sessionDate` sont
 * stockées en heure murale naïve (chiffres UTC littéraux = heure de Paris
 * saisie, voir app/api/sessions/route.ts) — on construit d'abord la valeur
 * dans ce même espace naïf avec des setters **UTC** (`setUTCHours`, jamais
 * `setHours` : sensible au fuseau du host, correct par accident seulement sur
 * une machine déjà réglée sur Europe/Paris), puis on la convertit en instant
 * réel via `naiveToRealInstant` avant de la comparer à `now` (qui, lui, est un
 * vrai instant réel — cf. bug remonté sur les rappels de séance décalés de 2h).
 */
export function debriefOpensAt(
  sessionDate: Date,
  startTime: Date | null,
  durationMinutes: number | null
): Date {
  const d = new Date(sessionDate)
  if (!startTime) {
    d.setUTCHours(NO_TIME_OPENS_HOUR, NO_TIME_OPENS_MINUTE, 0, 0)
    return naiveToRealInstant(d)
  }
  if (durationMinutes == null) {
    d.setUTCHours(NO_DURATION_OPENS_HOUR, 0, 0, 0)
    return naiveToRealInstant(d)
  }
  d.setUTCHours(startTime.getUTCHours(), startTime.getUTCMinutes() + durationMinutes, 0, 0)
  return naiveToRealInstant(d)
}

/**
 * La séance est-elle terminée (même règle que l'ouverture du debrief) ? Utilisé
 * pour le badge "Passée"/"À venir" et pour n'autoriser le ressenti qu'une fois la
 * séance réellement finie — pas dès le début de la journée (`sessionDate` seul
 * est minuit, comparer directement dessus l'affichait "Passée" dès 0h).
 */
export function hasSessionEnded(
  sessionDate: Date,
  startTime: Date | null,
  durationMinutes: number | null,
  now: Date = new Date()
): boolean {
  return now >= debriefOpensAt(sessionDate, startTime, durationMinutes)
}

export type SessionLog = { difficulty: number | null; skipped: boolean } | null | undefined

export function computeDebriefStatus(
  sessionDate: Date,
  log: SessionLog,
  startTime: Date | null = null,
  durationMinutes: number | null = null,
  now: Date = new Date()
): DebriefStatus {
  const opensAt = debriefOpensAt(sessionDate, startTime, durationMinutes)
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
