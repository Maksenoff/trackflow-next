/**
 * Calculateur d'allure — un athlète a une consigne en % d'allure sur une
 * distance donnée (ex: "150m à 80%") mais ne connaît son propre niveau que
 * sur des distances "repères" habituelles (100/200/300/400/600/800m). Le
 * calculateur convertit : temps repère connu → vitesse → temps cible sur la
 * distance de la séance, à N% de cette vitesse. Demande Maksen 2026-09-20.
 *
 * Portée volontairement limitée à 800m max (au-delà, l'hypothèse "vitesse
 * constante entre deux distances proches" ne tient plus assez pour un calcul
 * simple — sortie de portée pour cet outil).
 */

export const MAX_DISTANCE = 800

/** Distances repères "standard" dont un athlète connaît généralement le
 * temps (chrono d'entraînement ou compétition) — mêmes distances que les
 * spécialités sprint/demi-fond du profil athlète (§10 CLAUDE.md), limitées à
 * la portée de l'outil. */
export const ANCHOR_DISTANCES = [100, 200, 300, 400, 600, 800] as const

/**
 * Distance repère suggérée pour une distance cible donnée : la plus petite
 * distance standard strictement supérieure à la cible (ex: 150m → 200m,
 * l'exemple donné par Maksen) — la référence doit être un effort un peu plus
 * long que la cible pour que l'estimation de vitesse soit fiable. Au-delà de
 * 800m (ou exactement 800m), la référence est 800m elle-même.
 */
export function suggestedReferenceDistance(targetDistance: number): number {
  if (targetDistance >= MAX_DISTANCE) return MAX_DISTANCE
  const next = ANCHOR_DISTANCES.find((d) => d > targetDistance)
  return next ?? MAX_DISTANCE
}

/**
 * Temps cible sur `targetDistance`, à `percent`% de la vitesse déduite de
 * `referenceDistance` parcourue en `referenceTimeSeconds`. Vitesse constante
 * entre repère et cible à 100%, puis temps divisé par le %  (courir plus
 * lentement = plus de temps pour la même distance).
 */
export function computeTargetTimeSeconds(
  referenceDistance: number,
  referenceTimeSeconds: number,
  targetDistance: number,
  percent: number
): number | null {
  if (referenceDistance <= 0 || referenceTimeSeconds <= 0) return null
  if (targetDistance <= 0 || percent <= 0) return null
  const speedMetersPerSecond = referenceDistance / referenceTimeSeconds
  const timeAt100Percent = targetDistance / speedMetersPerSecond
  return timeAt100Percent / (percent / 100)
}

/** Parse un temps saisi librement : "25.4", "25,4" (secondes) ou "1:05.3"
 * (min:sec). Retourne `null` si invalide. */
export function parseTimeInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return null
  if (trimmed.includes(':')) {
    const [minStr, secStr] = trimmed.split(':')
    const minutes = Number(minStr)
    const seconds = Number(secStr)
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0) {
      return null
    }
    return minutes * 60 + seconds
  }
  const seconds = Number(trimmed)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

/** Formate un temps en secondes vers "ss.cc" (< 1 min) ou "m:ss.cc". */
export function formatTimeSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
  }
  return `${seconds.toFixed(2)}s`
}
