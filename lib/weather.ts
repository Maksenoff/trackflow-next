import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react'

// Position fixe du club (Marquette-lez-Lille, Nord) — pas de géolocalisation,
// demande explicite de Maksen le 2026-09-18 ("tu places le curseur à
// Marquette lez Lille, ça bougera pas").
const CLUB_LAT = 50.6667
const CLUB_LON = 3.1

// Heure d'entraînement par défaut (18h30-19h, retour Maksen 2026-09-18) — de
// repli seulement, quand une séance n'a pas d'heure de début renseignée.
// Quand elle en a une, c'est CETTE heure-là qui est utilisée (retour Maksen
// 2026-09-18 : "fait que la météo de ce jour à la bonne heure soit mise").
export const DEFAULT_TRAINING_HOUR = 19

export type HourForecast = { code: number; temp: number; windSpeed: number }
/** Prévisions heure par heure : date "YYYY-MM-DD" → heure "HH:00" → météo. */
export type WeeklyHourlyWeather = Record<string, Record<string, HourForecast>>

/**
 * Prévisions météo heure par heure (Open-Meteo — gratuit, sans clé API) —
 * 16 jours à venir + 16 jours passés (`past_days`, l'API Forecast
 * d'Open-Meteo renvoie aussi les relevés réels récents dans la même réponse
 * `hourly`, pas besoin de son API Archive séparée). Le détail heure par
 * heure (plutôt qu'une seule heure fixe comme avant) permet à chaque appelant
 * de caler la prévision sur l'heure réelle d'une séance donnée via
 * `forecastAt` ci-dessous. Erreurs avalées silencieusement (même logique que
 * le scraping FFA, cf. §9 CLAUDE.md) : l'UI retombe simplement sur l'état
 * sans météo si l'appel échoue ou si la date est hors des 32 jours couverts.
 */
export async function getClubHourlyWeather(): Promise<WeeklyHourlyWeather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${CLUB_LAT}&longitude=${CLUB_LON}` +
      `&hourly=weather_code,temperature_2m,wind_speed_10m&timezone=Europe%2FParis&forecast_days=16&past_days=16`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return {}
    const data = await res.json()
    const time: string[] = data?.hourly?.time
    const codes: number[] = data?.hourly?.weather_code
    const temps: number[] = data?.hourly?.temperature_2m
    const winds: number[] = data?.hourly?.wind_speed_10m
    if (!Array.isArray(time)) return {}

    const result: WeeklyHourlyWeather = {}
    time.forEach((isoHour, i) => {
      // isoHour format: "2026-09-18T19:00"
      const [date, hour] = isoHour.split('T')
      if (!date || !hour) return
      ;(result[date] ??= {})[hour] = { code: codes[i], temp: temps[i], windSpeed: winds[i] }
    })
    return result
  } catch {
    return {}
  }
}

/**
 * Prévision à une date + heure précises (heure arrondie à l'heure pleine la
 * plus proche, l'API n'en fournit pas plus fin). `hour` est l'heure "naïve"
 * du club (cf. `Date.prototype.getUTCHours()` sur un `startTime` de séance —
 * même convention de stockage que `lib/date.ts`), pas une heure UTC réelle.
 */
export function forecastAt(
  weather: WeeklyHourlyWeather | undefined,
  dateKey: string,
  hour: number
): HourForecast | undefined {
  const rounded = Math.min(23, Math.max(0, Math.round(hour)))
  return weather?.[dateKey]?.[`${String(rounded).padStart(2, '0')}:00`]
}

/** Codes météo WMO (doc Open-Meteo) → icône + libellé FR. */
export function weatherIcon(code: number): { Icon: LucideIcon; label: string } {
  if (code === 0) return { Icon: Sun, label: 'Ensoleillé' }
  if (code === 1 || code === 2) return { Icon: CloudSun, label: 'Partiellement nuageux' }
  if (code === 3) return { Icon: Cloud, label: 'Nuageux' }
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Brouillard' }
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, label: 'Bruine' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, label: 'Pluie' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, label: 'Neige' }
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, label: 'Orage' }
  return { Icon: Cloud, label: 'Nuageux' }
}

/** Fond/texte colorés par famille météo — plus lisible qu'un pictogramme
 * neutre sur fond gris (retour Maksen 2026-09-18, "on voit pas bien"). */
export function weatherTone(code: number): string {
  if (code === 0) return 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
  if (code === 1 || code === 2)
    return 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
  if (code === 3 || code === 45 || code === 48)
    return 'bg-slate-500/15 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300'
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400'
  if ([95, 96, 99].includes(code))
    return 'bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'
  // Bruine/pluie (51-67, 80-82) — famille par défaut la plus fréquente sous
  // nos latitudes.
  return 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
}
