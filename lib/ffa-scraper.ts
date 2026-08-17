// Port fidèle de FfaSync (repo Symfony, src/Service/FfaSync.php) — logique de scraping
// athle.fr isolée ici, conformément à la règle du CLAUDE.md §9.

import * as cheerio from 'cheerio'
import { prisma } from '@/lib/prisma'

const ATHLETE_PAGE_URL = (id: string) => `https://www.athle.fr/athletes/${id}/resultats`
const AJAX_URL = 'https://www.athle.fr/ajax/fiche-athlete-resultats.aspx'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** [regex, discipline, unit] — checked against both raw and space-compacted discipline string */
const DISCIPLINE_PATTERNS: [RegExp, string, string][] = [
  // ── Haies (avant les courses plates pour éviter les faux matchs) ──────
  [/^50\s*m\s*(haies?|h\.?)\b/i, '50m-haies', 's'],
  [/^80\s*m\s*(haies?|h\.?)\b/i, '80m-haies', 's'],
  [/^60\s*m\s*(haies?|h\.?)\b/i, '60m-haies', 's'],
  [/^100\s*m\s*(haies?|h\.?)\b/i, '100m-haies', 's'],
  [/^110\s*m\s*(haies?|h\.?)\b/i, '110m-haies', 's'],
  [/^400\s*m\s*(haies?|h\.?)\b/i, '400m-haies', 's'],
  // ── Courses plates — distances adultes ────────────────────────────────
  [/^60\s*m\b/i, '60m', 's'],
  [/^100\s*m\b/i, '100m', 's'],
  [/^200\s*m\b/i, '200m', 's'],
  [/^400\s*m\b/i, '400m', 's'],
  [/^800\s*m\b/i, '800m', 's'],
  [/^1\s*500\s*m\b/i, '1500m', 's'],
  [/\bmile\b/i, '1500m', 's'],
  [/^3\s*000\s*m\s*(steeple(?:chase)?|st[eé]pple)\b/i, '3000m', 's'],
  [/^3\s*000\s*m\b/i, '3000m', 's'],
  [/^5\s*000\s*m\b/i, '5000m', 's'],
  [/^5\s*km\b/i, '5000m', 's'],
  [/^10\s*000\s*m\b/i, '10000m', 's'],
  [/^10\s*km\b/i, '10000m', 's'],
  [/semi.?marathon/i, 'semi-marathon', 's'],
  [/\bmarathon\b/i, 'marathon', 's'],
  // ── Courses plates — distances jeunes (NE PAS fusionner avec adultes) ─
  [/^50\s*m\b/i, '50m', 's'],
  [/^80\s*m\b/i, '80m', 's'],
  [/^150\s*m\b/i, '150m', 's'],
  [/^300\s*m\b/i, '300m', 's'],
  [/^600\s*m\b/i, '600m', 's'],
  [/^1\s*000\s*m\b/i, '1000m', 's'],
  [/^2\s*000\s*m\b/i, '2000m', 's'],
  // ── Marche (avant "marteau") ───────────────────────────────────────────
  [/march[e]?\b/iu, 'marche', 's'],
  // ── Cross ─────────────────────────────────────────────────────────────
  [/^cross\b/i, 'cross', 's'],
  [/course\s+des\s+as/i, 'cross', 's'],
  [/cross\s+des\s+as/i, 'cross', 's'],
  [/\btc[mfx]\b/i, 'cross', 's'],
  // ── Sauts ─────────────────────────────────────────────────────────────
  [/longueur/i, 'longueur', 'm'],
  [/hauteur/i, 'hauteur', 'm'],
  [/triple/i, 'triple', 'm'],
  [/perche/i, 'perche', 'm'],
  // ── Lancers — poids spécifique AVANT le fallback générique ──────────────
  [/poids.*7[,.]\d*\s*kg/i, 'poids-7kg', 'm'],
  [/poids.*6[,.]\d*\s*kg/i, 'poids-6kg', 'm'],
  [/poids.*5[,.]\d*\s*kg/i, 'poids-5kg', 'm'],
  [/poids.*4[,.]\d*\s*kg/i, 'poids-4kg', 'm'],
  [/poids.*3[,.]\d*\s*kg/i, 'poids-3kg', 'm'],
  [/poids.*2[,.]\d*\s*kg/i, 'poids-2kg', 'm'],
  [/poids/i, 'poids', 'm'],
  [/disque.*2[,.]\d*\s*kg/i, 'disque-2kg', 'm'],
  [/disque.*1[,.][5-9]\d*\s*kg/i, 'disque-1.5kg', 'm'],
  [/disque.*1[,.][0-4]?\d*\s*kg/i, 'disque-1kg', 'm'],
  [/disque.*750\s*g/i, 'disque-750g', 'm'],
  [/disque.*500\s*g/i, 'disque-500g', 'm'],
  [/disque/i, 'disque', 'm'],
  [/javelot.*800\s*g/i, 'javelot-800g', 'm'],
  [/javelot.*700\s*g/i, 'javelot-700g', 'm'],
  [/javelot.*600\s*g/i, 'javelot-600g', 'm'],
  [/javelot.*500\s*g/i, 'javelot-500g', 'm'],
  [/javelot/i, 'javelot', 'm'],
  [/marteau.*7[,.]\d*\s*kg/i, 'marteau-7kg', 'm'],
  [/marteau.*6[,.]\d*\s*kg/i, 'marteau-6kg', 'm'],
  [/marteau.*5[,.]\d*\s*kg/i, 'marteau-5kg', 'm'],
  [/marteau.*4[,.]\d*\s*kg/i, 'marteau-4kg', 'm'],
  [/marteau.*3[,.]\d*\s*kg/i, 'marteau-3kg', 'm'],
  [/marteau/i, 'marteau', 'm'],
  // ── Épreuves combinées ─────────────────────────────────────────────────
  [/d[ée]cathlon/i, 'decathlon', 'pts'],
  [/heptathlon/i, 'heptathlon', 'pts'],
  [/pentathlon/i, 'pentathlon', 'pts'],
  [/triathlon/i, 'triathlon', 'pts'],
  // ── Relais — distances exactes ─────────────────────────────────────────
  [/^4\s*[xX×]\s*60\s*m?\b/i, '4x60m', 's'],
  [/^4\s*[xX×]\s*80\s*m?\b/i, '4x80m', 's'],
  [/^4\s*[xX×]\s*100\s*m?\b/i, '4x100m', 's'],
  [/^4\s*[xX×]\s*200\s*m?\b/i, '4x200m', 's'],
  [/^4\s*[xX×]\s*400\s*m?\b/i, '4x400m', 's'],
  [/^relais\b/i, 'autre', 's'],
  [/^ekiden\b/i, 'autre', 's'],
  // ── Trail / route / hors piste / hors stade ────────────────────────────
  [/^trail\b/i, 'autre', 's'],
  [/hors[\s-]*(stade|piste)/iu, 'autre', 's'],
  [/\bH\.?S\.?\b/u, 'autre', 's'],
  [/course\s+(hors|sur)\s/iu, 'autre', 's'],
  [/course\s+de\s+(c[oô]te?|montagne)/iu, 'autre', 's'],
  [/montagne|nature|terrain\s+vari[eé]/iu, 'autre', 's'],
  [/\d+\s*km\b/i, 'autre', 's'],
  [/\d+\s*miles?\b/i, 'autre', 's'],
]

/** Temps minimum plausible (secondes) par discipline — filtre les valeurs impossibles. */
const MIN_TIMES: Record<string, number> = {
  '50m': 5.0,
  '60m': 5.5,
  '80m': 7.0,
  '100m': 8.5,
  '150m': 13.0,
  '200m': 18.0,
  '300m': 28.0,
  '400m': 40.0,
  '600m': 72.0,
  '800m': 90.0,
  '1000m': 120.0,
  '1500m': 200.0,
  '2000m': 280.0,
  '3000m': 450.0,
  '5000m': 750.0,
  '10000m': 1600.0,
  '60m-haies': 6.0,
  '100m-haies': 10.5,
  '110m-haies': 11.0,
  '400m-haies': 45.0,
  '4x60m': 22.0,
  '4x80m': 30.0,
  '4x100m': 33.0,
  '4x200m': 72.0,
  '4x400m': 170.0,
}

export type FfaProfile = {
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  gender: string | null
  discipline: string[]
  licenseNumber: string | null
  error: string | null
}

export type FfaSyncResult = { imported: number; skipped: number; error: string | null }

// =========================================================================
// PUBLIC API
// =========================================================================

/** Fetch profile info from an athle.fr athlete URL (used for the FFA import mode on /athletes/new). */
export async function lookupFfaProfile(url: string): Promise<FfaProfile> {
  const athleteId = extractAthleteId(url)
  if (athleteId === null) {
    return emptyProfile(
      'URL invalide. Utilisez le format : https://www.athle.fr/athletes/XXXXX/resultats'
    )
  }

  const [html] = await fetchWithCookie(ATHLETE_PAGE_URL(athleteId))
  if (html === null) {
    return emptyProfile('Impossible de charger la page athlète. Vérifiez l’URL.')
  }

  return parseProfile(html)
}

/** Import all competition results for an athlete linked via `ffaProfileUrl`. */
export async function syncAthleteFfa(athleteId: string): Promise<FfaSyncResult> {
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId } })
  if (!athlete) return { imported: 0, skipped: 0, error: 'Athlète introuvable.' }
  if (!athlete.ffaProfileUrl) {
    return { imported: 0, skipped: 0, error: 'Aucune URL de profil renseignée.' }
  }

  const ffaId = extractAthleteId(athlete.ffaProfileUrl)
  if (ffaId === null) {
    return {
      imported: 0,
      skipped: 0,
      error: 'URL invalide. Format attendu : https://www.athle.fr/athletes/XXXXX/resultats',
    }
  }

  const [html, cookie] = await fetchWithCookie(ATHLETE_PAGE_URL(ffaId))
  if (html === null) {
    return { imported: 0, skipped: 0, error: 'Impossible de charger la page athlète.' }
  }

  let years = extractAvailableYears(html)
  if (years.length === 0) {
    const currentYear = new Date().getFullYear()
    years = []
    for (let y = currentYear; y >= Math.max(2010, currentYear - 5); y--) years.push(y)
  }
  if (athlete.ffaSyncSinceYear !== null) {
    years = years.filter((y) => y >= athlete.ffaSyncSinceYear!)
  }
  const syncCutoff =
    athlete.ffaSyncSinceYear !== null ? new Date(athlete.ffaSyncSinceYear, 8, 1) : null

  // Rafraîchit le profil (genre, licence) — jamais le nom/date de naissance/disciplines manuelles
  const profile = parseProfile(html)
  const profileUpdate: { gender?: string; licenseNumber?: string; disciplines?: string } = {}
  if (profile.gender && athlete.gender !== profile.gender) {
    profileUpdate.gender = profile.gender
  }
  if (profile.licenseNumber && athlete.licenseNumber !== profile.licenseNumber) {
    profileUpdate.licenseNumber = profile.licenseNumber
  }
  const currentDisciplines = JSON.parse(athlete.disciplines) as string[]
  if (currentDisciplines.length === 0 && profile.discipline.length > 0) {
    profileUpdate.disciplines = JSON.stringify(profile.discipline)
  }
  if (Object.keys(profileUpdate).length > 0) {
    await prisma.athlete.update({ where: { id: athleteId }, data: profileUpdate })
  }

  let imported = 0
  let skipped = 0

  for (const year of years) {
    const ajaxHtml = await fetchAjaxResults(ffaId, year, cookie)
    if (ajaxHtml === null) continue

    const rows = parseResults(ajaxHtml, year)
    for (const row of rows) {
      if (syncCutoff && row.date < syncCutoff) continue
      const discipline = refineByCategory(
        row.discipline,
        athlete.gender,
        athlete.birthDate,
        row.date
      )
      const existing = await prisma.performance.findFirst({
        where: {
          athleteId,
          discipline,
          value: row.value,
          recordedAt: row.date,
        },
      })

      if (existing) {
        const data: Record<string, unknown> = {}
        if (row.level !== null && existing.level !== row.level) data.level = row.level
        if (row.levelPts !== null && existing.levelPoints !== row.levelPts)
          data.levelPoints = row.levelPts
        if (row.wind !== null && existing.wind !== row.wind) data.wind = row.wind
        if (row.venue !== null && existing.venue !== row.venue) data.venue = row.venue
        if (existing.isIndoor !== row.isIndoor) data.isIndoor = row.isIndoor
        if (Object.keys(data).length > 0) {
          await prisma.performance.update({ where: { id: existing.id }, data })
        }
        skipped++
        continue
      }

      await prisma.performance.create({
        data: {
          athleteId,
          discipline,
          unit: row.unit,
          value: row.value,
          recordedAt: row.date,
          isCompetition: true,
          isPersonalBest: false,
          isIndoor: row.isIndoor,
          venue: row.venue,
          level: row.level,
          levelPoints: row.levelPts,
          wind: row.wind,
        },
      })
      imported++
    }
  }

  if (imported > 0) await updatePersonalBests(athleteId)

  await prisma.athlete.update({ where: { id: athleteId }, data: { lastSyncedAt: new Date() } })

  return { imported, skipped, error: null }
}

/** Admin uniquement : supprime toutes les perfs FFA et réimporte à partir de zéro. */
export async function fullResyncAthleteFfa(athleteId: string): Promise<FfaSyncResult> {
  await prisma.performance.deleteMany({ where: { athleteId, isCompetition: true } })
  await updatePersonalBests(athleteId)
  return syncAthleteFfa(athleteId)
}

/** Recalcule les records personnels (meilleure valeur par discipline). */
async function updatePersonalBests(athleteId: string): Promise<void> {
  const all = await prisma.performance.findMany({ where: { athleteId } })
  if (all.length === 0) return

  const bests = new Map<string, (typeof all)[number]>()
  for (const p of all) {
    const higherBetter = p.unit !== 's'
    const current = bests.get(p.discipline)
    if (!current) {
      bests.set(p.discipline, p)
    } else if (higherBetter ? p.value > current.value : p.value < current.value) {
      bests.set(p.discipline, p)
    }
  }

  const bestIds = new Set(Array.from(bests.values()).map((p) => p.id))
  await prisma.$transaction([
    prisma.performance.updateMany({ where: { athleteId }, data: { isPersonalBest: false } }),
    ...Array.from(bestIds).map((id) =>
      prisma.performance.update({ where: { id }, data: { isPersonalBest: true } })
    ),
  ])
}

// =========================================================================
// HELPERS PRIVÉS
// =========================================================================

function emptyProfile(error: string): FfaProfile {
  return {
    firstName: null,
    lastName: null,
    birthDate: null,
    gender: null,
    discipline: [],
    licenseNumber: null,
    error,
  }
}

/** Extrait l'ID interne athle.fr depuis une URL /athletes/{id}, ou un nombre brut. */
function extractAthleteId(url: string): string | null {
  const trimmed = url.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  const m = trimmed.match(/\/athletes\/(\d+)/)
  return m ? m[1] : null
}

/** Fetch une URL et retourne [html, cookieString]. */
async function fetchWithCookie(url: string): Promise<[string | null, string | null]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return [null, null]

    const cookies = (res.headers.getSetCookie?.() ?? []).map((raw) => raw.split(';')[0].trim())
    return [await res.text(), cookies.length > 0 ? cookies.join('; ') : null]
  } catch {
    return [null, null]
  }
}

/** Appelle l'endpoint AJAX des résultats pour un athlète + une année. */
async function fetchAjaxResults(
  athleteId: string,
  year: number,
  cookie: string | null
): Promise<string | null> {
  const url = `${AJAX_URL}?${new URLSearchParams({ seq: athleteId, annee: String(year) })}`
  try {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      Accept: 'text/html, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: ATHLETE_PAGE_URL(athleteId),
    }
    if (cookie) headers.Cookie = cookie

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const body = await res.text()
    const html = unwrapAjaxBody(body)
    return html && html.length > 10 ? html : null
  } catch {
    return null
  }
}

/**
 * L'endpoint AJAX renvoie tantôt un fragment HTML brut, tantôt un JSON
 * `[{"liste": "<thead>...</tbody>"}]` — dans ce cas on extrait le HTML interne.
 */
function unwrapAjaxBody(body: string): string {
  const trimmed = body.trim()
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return body

  try {
    const parsed = JSON.parse(trimmed)
    const entry = Array.isArray(parsed) ? parsed[0] : parsed
    if (entry && typeof entry.liste === 'string') return entry.liste
  } catch {
    // pas du JSON valide — on retombe sur le corps brut
  }
  return body
}

/** Extrait les années disponibles depuis la page athlète (data-value="YYYY"). */
function extractAvailableYears(html: string): number[] {
  const years = new Set<number>()
  const specificRe = /class="[^"]*select-option-anneeAth[^"]*"[^>]*data-value="(\d{4})"/gi
  for (const m of html.matchAll(specificRe)) {
    const y = Number(m[1])
    if (y >= 2000 && y <= 2100) years.add(y)
  }
  if (years.size === 0) {
    const fallbackRe = /data-value="(\d{4})"/gi
    for (const m of html.matchAll(fallbackRe)) {
      const y = Number(m[1])
      if (y >= 2000 && y <= 2100) years.add(y)
    }
  }
  return Array.from(years).sort((a, b) => b - a)
}

/** Parse le profil athlète depuis le HTML de la page athle.fr. */
function parseProfile(html: string): FfaProfile {
  const $ = cheerio.load(html)
  let firstName: string | null = null
  let lastName: string | null = null

  const title = $('title').first().text().trim()
  if (title) {
    const part = title.split('|')[0].trim()
    if (part.length > 2 && !/fédération/i.test(part)) {
      ;[firstName, lastName] = splitName(part)
    }
  }
  if (!firstName && !lastName) {
    const h1 = $('h1').first().text().trim().replace(/\s+/g, ' ')
    if (h1) [firstName, lastName] = splitName(h1)
  }

  let birthDate: string | null = null
  let birthYear: string | null = null
  let gender: string | null = null

  $('time[datetime]').each((_, el) => {
    if (birthDate !== null) return
    const dt = $(el).attr('datetime')
    if (dt && /^((?:19|20)\d{2})-(\d{2})-(\d{2})$/.test(dt)) birthDate = dt
  })

  if (birthDate === null) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const ld = JSON.parse($(el).text())
        const bd = ld?.birthDate
        if (bd && /^\d{4}-\d{2}-\d{2}$/.test(bd)) birthDate = bd
        else if (bd && /^\d{4}$/.test(bd)) birthYear = birthYear ?? `${bd}-01-01`
      } catch {
        // ignore malformed JSON-LD
      }
    })
  }

  $('p, span, div, td, li').each((_, el) => {
    const text = $(el).text().trim()
    if (birthDate === null) {
      const m = text.match(/(?:n[ée]e?\s*(?:le\s+)?|naissance\s*:\s*)(\d{2}\/\d{2}\/\d{4})/iu)
      if (m) {
        const d = parseDDMMYYYY(m[1])
        if (d) birthDate = d
      }
    }
    if (birthDate === null && /naiss|ddn|birth/iu.test(text)) {
      const m2 = text.match(/\b(\d{2}\/\d{2}\/(?:19|20)\d{2})\b/)
      if (m2) {
        const d = parseDDMMYYYY(m2[1])
        if (d) birthDate = d
      }
    }
    if (birthYear === null) {
      const m = text.match(/N[ée]\(?e?\)?\s+en\s*:\s*(\d{4})/iu)
      if (m) birthYear = `${m[1]}-01-01`
    }
    if (gender === null && /Cat[ée]gorie/iu.test(text)) {
      for (const part of text.split('/')) {
        const trimmed = part.trim()
        if (trimmed === 'M' || trimmed === 'F') {
          gender = trimmed
          break
        }
      }
    }
  })
  birthDate = birthDate ?? birthYear

  let licenseNumber: string | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (licenseNumber !== null) return
    try {
      const ld = JSON.parse($(el).text())
      for (const key of ['identifier', 'membershipNumber', 'licenseNumber']) {
        const val = ld?.[key]
        if (val && /^\d{6,10}$/.test(String(val).trim())) {
          licenseNumber = String(val).trim()
          break
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  })
  if (licenseNumber === null) {
    $('p, span, div, td, li, dt, dd').each((_, el) => {
      if (licenseNumber !== null) return
      const text = $(el).text().trim()
      const m = text.match(/licen[cs]e?\s*[:\-n°#]?\s*(\d{6,10})\b/iu)
      if (m) {
        licenseNumber = m[1]
        return
      }
      const m2 = text.match(/\bn[°o]\s*(?:de\s+)?licen[cs]e?\s*[:\-]?\s*(\d{6,10})\b/iu)
      if (m2) licenseNumber = m2[1]
    })
  }
  if (licenseNumber === null) {
    const m = html.match(/content=["'](\d{6,10})["'][^>]*licen/i)
    if (m) licenseNumber = m[1]
  }

  const counts = new Map<string, number>()
  $('td').each((_, el) => {
    const mapped = mapDiscipline($(el).text().trim())
    if (mapped) counts.set(mapped[0], (counts.get(mapped[0]) ?? 0) + 1)
  })
  let discipline: string | null = null
  let max = 0
  for (const [d, c] of counts) {
    if (c > max) {
      max = c
      discipline = d
    }
  }

  return {
    firstName,
    lastName,
    birthDate,
    gender,
    discipline: discipline ? [discipline] : [],
    licenseNumber,
    error:
      !firstName && !lastName
        ? 'Nom introuvable. Vérifiez l’URL (format : https://www.athle.fr/athletes/XXXXX/resultats).'
        : null,
  }
}

function parseDDMMYYYY(raw: string): string | null {
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

type ResultRow = {
  discipline: string
  unit: string
  value: number
  date: Date
  isIndoor: boolean
  venue: string | null
  level: string | null
  levelPts: number | null
  wind: string | null
}

/** Parse le fragment HTML AJAX retourné par fiche-athlete-resultats.aspx. */
function parseResults(html: string, year: number): ResultRow[] {
  const $ = cheerio.load(`<table>${html}</table>`)
  const results: ResultRow[] = []

  $('tr.clickable').each((_, tr) => {
    const cells = $(tr).find('td')
    if (cells.length < 3) return
    const texts: string[] = []
    cells.each((i, td) => {
      texts[i] = $(td).text().trim()
    })

    const rawDisc = texts[1] ?? ''
    let mapped = mapDiscipline(rawDisc)
    if (!mapped) {
      const fallback = slugifyDiscipline(rawDisc)
      if (fallback === null) return
      const rawVal = (texts[2] ?? '').trim()
      let unit: string
      if (/^\d+m\d{1,2}$/i.test(rawVal)) unit = 'm'
      else if (rawVal.toLowerCase().includes('pts')) unit = 'pts'
      else unit = 's'
      mapped = [fallback, unit]
    }

    const [discipline, unit] = mapped
    const value = parsePerf(texts[2] ?? '', unit)
    const date = parsePartialDate(texts[0] ?? '', year)
    const isIndoor = /\b(salle|indoor|piste\s+courte?)\b/iu.test(rawDisc)
    const venue = texts[8] || null
    const level = texts[6] && texts[6] !== '-' ? texts[6] : null
    const levelPtsRaw = (texts[7] ?? '').trim()
    const levelPts =
      levelPtsRaw !== '' && !Number.isNaN(Number(levelPtsRaw)) ? parseInt(levelPtsRaw, 10) : null
    const wind = parseWind((texts[3] ?? '').trim())

    if (value !== null && date !== null) {
      const minTime = MIN_TIMES[discipline]
      if (unit === 's' && minTime !== undefined && value < minTime) return
      results.push({ discipline, unit, value, date, isIndoor, venue, level, levelPts, wind })
    }
  })

  const seen = new Set<string>()
  const unique: ResultRow[] = []
  for (const r of results) {
    const key = `${r.discipline}|${r.value}|${r.date.toISOString().slice(0, 10)}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(r)
    }
  }
  return unique
}

function parseWind(raw: string): string | null {
  if (raw === '' || raw === '-') return null
  if (raw.toUpperCase() === 'NC') return 'NC'
  const clean = raw.replace(',', '.')
  if (/^[+-]?\d+(?:\.\d+)?$/.test(clean)) {
    const val = parseFloat(clean)
    return (val >= 0 ? '+' : '') + val.toFixed(1)
  }
  return null
}

/**
 * Affine un slug générique (poids, disque, javelot, marteau, haies) vers sa variante
 * poids/hauteur spécifique selon l'âge FFA (année compét − année naissance) et le genre.
 */
function refineByCategory(
  disc: string,
  gender: string | null,
  birth: Date | null,
  date: Date
): string {
  if (!birth || !gender) return disc
  const age = date.getFullYear() - birth.getFullYear()
  const isM = gender === 'M'

  switch (disc) {
    case 'poids':
      if (age >= 20) return isM ? 'poids-7kg' : 'poids-4kg'
      if (age >= 18) return isM ? 'poids-6kg' : 'poids-4kg'
      if (age >= 16) return isM ? 'poids-5kg' : 'poids-3kg'
      if (age >= 14) return isM ? 'poids-4kg' : 'poids-3kg'
      if (age >= 12) return isM ? 'poids-3kg' : 'poids-2kg'
      return disc
    case 'disque':
      if (age >= 20) return isM ? 'disque-2kg' : 'disque-1kg'
      if (age >= 16) return isM ? 'disque-1.5kg' : 'disque-1kg'
      if (age >= 14) return isM ? 'disque-1kg' : 'disque-750g'
      if (age >= 12) return isM ? 'disque-750g' : 'disque-500g'
      return disc
    case 'javelot':
      if (age >= 18) return isM ? 'javelot-800g' : 'javelot-600g'
      if (age >= 16) return isM ? 'javelot-700g' : 'javelot-500g'
      if (age >= 14) return isM ? 'javelot-600g' : 'javelot-500g'
      return disc
    case 'marteau':
      if (age >= 20) return isM ? 'marteau-7kg' : 'marteau-4kg'
      if (age >= 18) return isM ? 'marteau-6kg' : 'marteau-4kg'
      if (age >= 16) return isM ? 'marteau-5kg' : 'marteau-3kg'
      return disc
    case '60m-haies':
      if (age >= 20) return isM ? '60m-haies-107cm' : '60m-haies-84cm'
      if (age >= 18) return isM ? '60m-haies-99cm' : '60m-haies-76cm'
      if (age >= 16) return isM ? '60m-haies-91cm' : '60m-haies-76cm'
      if (age >= 14) return '60m-haies-76cm'
      return disc
    case '110m-haies':
      return isM ? '110m-haies-107cm' : disc
    case '100m-haies':
      return !isM ? '100m-haies-84cm' : disc
    case '400m-haies':
      return isM ? '400m-haies-91cm' : '400m-haies-76cm'
    case '80m-haies':
      return '80m-haies-76cm'
    default:
      return disc
  }
}

/** Convertit un nom de discipline athle.fr en [discipline, unit]. */
function mapDiscipline(raw: string): [string, string] | null {
  const norm = raw
    .replace(/[-\s]*(salle|indoor|en\s+salle|tcm|piste\s+couverte)\s*$/iu, '')
    .replace(/\s+/g, ' ')
    .trim()
  const compact = norm.replace(/(\d)\s+(\d)/gu, '$1$2')

  for (const [pattern, discipline, unit] of DISCIPLINE_PATTERNS) {
    if (pattern.test(norm) || pattern.test(compact)) return [discipline, unit]
  }
  return null
}

/** Fallback : convertit une chaîne de discipline FFA non reconnue en slug. */
function slugifyDiscipline(raw: string): string | null {
  const norm = raw
    .replace(/[-\s]*(salle|indoor|en\s+salle|tcm|piste\s+couverte)\s*$/iu, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (norm.length < 2) return null

  let slug = norm.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  if (slug.length < 2 || /^\d+$/.test(slug.replace(/-/g, ''))) return null
  return slug
}

/** Parse une chaîne de performance en nombre (secondes, mètres, ou points). */
function parsePerf(raw: string, unit: string): number | null {
  raw = raw.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (raw === '') return null
  if (
    ['-', 'DNS', 'DNF', 'DQ', 'NM', 'PM', 'AB', 'ABD', 'DISQ', 'NP'].includes(raw.toUpperCase())
  ) {
    return null
  }

  raw = raw.replace(/''/g, '"')

  if (unit === 's') {
    let m = raw.match(/^(\d+)[h'](\d+)['"](\d+)[".,](\d+)$/u)
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`)

    m = raw.match(/^(\d+)['](\d+)[".,](\d+)$/u)
    if (m) return Number(m[1]) * 60 + Number(m[2]) + Number(`0.${m[3]}`)

    m = raw.match(/^(\d+)['](\d+)["]?$/u)
    if (m) return Number(m[1]) * 60 + Number(m[2])

    m = raw.match(/^(\d+)"(\d+)$/)
    if (m) return Number(m[1]) + Number(`0.${m[2]}`)

    const parts = raw.replace(',', '.').split(':')
    if (parts.length === 3)
      return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
    if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1])
    const clean = raw.replace(',', '.')
    return clean !== '' && !Number.isNaN(Number(clean)) ? Number(clean) : null
  }

  const fieldMatch = raw.match(/^(\d+)m(\d{1,2})$/i)
  if (fieldMatch) return Number(fieldMatch[1]) + Number(fieldMatch[2].padEnd(2, '0')) / 100

  raw = raw.replace(/\s*pts\s*$/i, '')
  const clean = raw.replace(/[ ,]/g, (c) => (c === ',' ? '.' : ''))
  return clean !== '' && !Number.isNaN(Number(clean)) ? Number(clean) : null
}

const MONTHS_FR: Record<string, number> = {
  jan: 1,
  fév: 2,
  fev: 2,
  mar: 3,
  avr: 4,
  mai: 5,
  juin: 6,
  jui: 6,
  juil: 7,
  jul: 7,
  aoû: 8,
  aou: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  déc: 12,
  dec: 12,
}

function lookupMonth(word: string): number | null {
  const k4 = word.slice(0, 4).toLowerCase()
  const k3 = word.slice(0, 3).toLowerCase()
  return MONTHS_FR[k4] ?? MONTHS_FR[k3] ?? null
}

/** Parse une date partielle "12 Mai" avec l'année fournie, ou une date complète. */
function parsePartialDate(raw: string, year: number): Date | null {
  raw = raw.trim()
  if (raw === '') return null

  for (const fmt of ['d/m/Y', 'd-m-Y', 'Y-m-d'] as const) {
    const d = parseFixedDate(raw, fmt)
    if (d) return d
  }

  let m = raw.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]{2,8})\.?$/u)
  if (m) {
    const month = lookupMonth(m[2])
    if (month !== null) return new Date(year, month - 1, Number(m[1]))
  }

  m = raw.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]{2,8})\.?\s+(\d{4})/u)
  if (m) {
    const month = lookupMonth(m[2])
    if (month !== null) return new Date(Number(m[3]), month - 1, Number(m[1]))
  }

  return null
}

function parseFixedDate(raw: string, fmt: 'd/m/Y' | 'd-m-Y' | 'Y-m-d'): Date | null {
  const sep = fmt.includes('/') ? '/' : '-'
  const parts = raw.split(sep)
  if (parts.length !== 3) return null
  if (fmt === 'Y-m-d') {
    const [y, mo, d] = parts.map(Number)
    if (!y || !mo || !d) return null
    return new Date(y, mo - 1, d)
  }
  const [d, mo, y] = parts.map(Number)
  if (!d || !mo || !y) return null
  return new Date(y, mo - 1, d)
}

/** Découpe "Firstname LASTNAME" ou "LASTNAME Firstname" en [firstName, lastName]. */
function splitName(text: string): [string | null, string | null] {
  text = text.replace(/\s*[|-].*$/u, '').trim()
  const words = text.split(/\s+/u).filter(Boolean)
  if (words.length < 2) return [null, null]

  const upper: string[] = []
  const mixed: string[] = []
  for (const w of words) {
    const clean = w.replace(/[^\p{L}]/gu, '')
    if (clean && clean.toUpperCase() === clean) upper.push(w)
    else mixed.push(w)
  }

  if (upper.length === 0 || mixed.length === 0) return [null, null]

  const titleCase = mixed
    .join(' ')
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())

  return [titleCase, upper.join(' ').toUpperCase()]
}
