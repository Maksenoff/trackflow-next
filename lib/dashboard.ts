// Agrégation des données du tableau de bord — portage de DashboardController.php
// (repo Symfony Maksenoff/Trackflow, src/Controller/DashboardController.php)

import { prisma } from '@/lib/prisma'
import {
  calcTrend,
  computeSeasonBests,
  formatPerformanceValue,
  type Trend,
} from '@/lib/performance'
import { isAdmin, isAthlete, isCoach } from '@/lib/roles'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export type SessionWidgetItem = {
  id: string
  title: string
  date: Date
  description: string | null
  startTime: Date | null
  durationMinutes: number | null
  trainingType: { name: string; color: string } | null
  coach: { firstName: string } | null
  coachPresent: boolean
}

export type CompetitionWidgetItem = {
  id: string
  title: string
  location: string | null
  date: Date
  colorBg: string
  typeLabel: string
  registrationCount: number
  isRegistered: boolean
}

export type PerformanceWidgetItem = {
  id: string
  athleteId: string
  athleteName: string
  discipline: string
  date: Date
  value: string
  isPB: boolean
  isSB: boolean
  trend: Trend | null
}

async function getUpcomingSessions(limit = 4): Promise<SessionWidgetItem[]> {
  const sessions = await prisma.session.findMany({
    where: { date: { gte: startOfToday() } },
    orderBy: { date: 'asc' },
    take: limit,
    include: { trainingType: true, coach: { select: { firstName: true } } },
  })
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date,
    description: s.description,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
    trainingType: s.trainingType
      ? { name: s.trainingType.name, color: s.trainingType.color }
      : null,
    coach: s.coach ? { firstName: s.coach.firstName } : null,
    coachPresent: s.coachPresent,
  }))
}

async function getUpcomingCompetitions(
  athleteId: string | null,
  limit = 4
): Promise<CompetitionWidgetItem[]> {
  const competitions = await prisma.competition.findMany({
    where: { date: { gte: startOfToday() } },
    orderBy: { date: 'asc' },
    take: limit,
    include: { competitionType: true },
  })
  if (competitions.length === 0) return []

  const ids = competitions.map((c) => c.id)
  const counts = await prisma.competitionRegistration.groupBy({
    by: ['competitionId'],
    where: { competitionId: { in: ids } },
    _count: true,
  })
  const countMap = new Map(counts.map((c) => [c.competitionId, c._count]))

  let registeredIds = new Set<string>()
  if (athleteId) {
    const regs = await prisma.competitionRegistration.findMany({
      where: { athleteId, competitionId: { in: ids } },
      select: { competitionId: true },
    })
    registeredIds = new Set(regs.map((r) => r.competitionId))
  }

  return competitions.map((c) => ({
    id: c.id,
    title: c.title,
    location: c.location,
    date: c.date,
    colorBg: c.competitionType?.color ?? '#f59e0b',
    typeLabel: c.competitionType?.name ?? '—',
    registrationCount: countMap.get(c.id) ?? 0,
    isRegistered: registeredIds.has(c.id),
  }))
}

type PerfRow = {
  id: string
  athleteId: string
  discipline: string
  value: number
  unit: string
  recordedAt: Date
  isPersonalBest: boolean
}

async function findLastBefore(
  athleteId: string,
  discipline: string,
  before: Date,
  excludeId: string
) {
  return prisma.performance.findFirst({
    where: { athleteId, discipline, recordedAt: { lte: before }, id: { not: excludeId } },
    orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
  })
}

async function buildPerfTrends(performances: PerfRow[]): Promise<Map<string, Trend>> {
  const trends = new Map<string, Trend>()
  for (const perf of performances) {
    const prev = await findLastBefore(perf.athleteId, perf.discipline, perf.recordedAt, perf.id)
    if (!prev) continue
    const trend = calcTrend(perf, { value: prev.value, unit: prev.unit })
    if (trend) trends.set(perf.id, trend)
  }
  return trends
}

async function getSeasonBestIds(athleteId: string): Promise<Set<string>> {
  const perfs = await prisma.performance.findMany({ where: { athleteId } })
  const bests = computeSeasonBests(perfs)
  return new Set(Array.from(bests.values()).map((p) => p.id))
}

function toWidgetPerf(
  perf: PerfRow,
  athleteName: string,
  sbIds: Set<string>,
  trends: Map<string, Trend>
): PerformanceWidgetItem {
  return {
    id: perf.id,
    athleteId: perf.athleteId,
    athleteName,
    discipline: perf.discipline,
    date: perf.recordedAt,
    value: formatPerformanceValue(perf.value, perf.unit),
    isPB: perf.isPersonalBest,
    isSB: sbIds.has(perf.id),
    trend: trends.get(perf.id) ?? null,
  }
}

/** Un utilisateur Admin/Coach voit toujours la vue coach, même s'il a aussi ROLE_ATHLETE */
function resolveView(roles: string[]): 'athlete' | 'coach' {
  const pureAthlete = isAthlete(roles) && !isCoach(roles) && !isAdmin(roles)
  return pureAthlete ? 'athlete' : 'coach'
}

async function getLinkedAthlete(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linkedAthlete: true },
  })
  return user?.linkedAthlete ?? null
}

/**
 * Données minimales pour le rendu synchrone de la page (header + décision
 * d'afficher les widgets ou l'écran "aucun profil lié") — chaque widget
 * re-résout ensuite ses propres données indépendamment sous son <Suspense>,
 * la petite duplication de requête (lookup du compte lié) est le prix d'un
 * vrai streaming par widget plutôt qu'un seul gros fetch bloquant.
 */
export async function getDashboardMeta(
  userId: string,
  roles: string[]
): Promise<{ view: 'athlete' | 'coach'; totalAthletes: number | null; hasLinkedAthlete: boolean }> {
  const view = resolveView(roles)
  const [linkedAthlete, totalAthletes] = await Promise.all([
    getLinkedAthlete(userId),
    view === 'coach' ? prisma.athlete.count() : Promise.resolve(null),
  ])
  return { view, totalAthletes, hasLinkedAthlete: !!linkedAthlete }
}

export async function getSessionsWidgetData(): Promise<{
  nextSession: SessionWidgetItem | null
  upcomingSessions: SessionWidgetItem[]
}> {
  const upcomingSessions = await getUpcomingSessions(4)
  return { nextSession: upcomingSessions[0] ?? null, upcomingSessions }
}

export async function getCompetitionsWidgetData(userId: string): Promise<{
  nextCompetition: CompetitionWidgetItem | null
  upcomingCompetitions: CompetitionWidgetItem[]
  hasLinkedAthlete: boolean
}> {
  const linkedAthlete = await getLinkedAthlete(userId)
  const upcomingCompetitions = await getUpcomingCompetitions(linkedAthlete?.id ?? null, 4)
  return {
    nextCompetition: upcomingCompetitions[0] ?? null,
    upcomingCompetitions,
    hasLinkedAthlete: !!linkedAthlete,
  }
}

export type AthletePerformancesData = {
  view: 'athlete'
  hasLinkedAthlete: boolean
  recentPerformances: PerformanceWidgetItem[]
}

export type CoachPerformancesData = {
  view: 'coach'
  hasLinkedAthlete: boolean
  allPerformances: PerformanceWidgetItem[]
  myPerformances: PerformanceWidgetItem[]
}

export async function getPerformancesWidgetData(
  userId: string,
  roles: string[]
): Promise<AthletePerformancesData | CoachPerformancesData> {
  const view = resolveView(roles)
  const linkedAthlete = await getLinkedAthlete(userId)

  if (view === 'athlete') {
    if (!linkedAthlete) {
      return { view: 'athlete', hasLinkedAthlete: false, recentPerformances: [] }
    }
    const perfs = await prisma.performance.findMany({
      where: { athleteId: linkedAthlete.id },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    })
    const [sbIds, trends] = await Promise.all([
      getSeasonBestIds(linkedAthlete.id),
      buildPerfTrends(perfs),
    ])
    const athleteName = `${linkedAthlete.firstName} ${linkedAthlete.lastName}`
    return {
      view: 'athlete',
      hasLinkedAthlete: true,
      recentPerformances: perfs.map((p) => toWidgetPerf(p, athleteName, sbIds, trends)),
    }
  }

  const coachPerfs = await prisma.performance.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 10,
    include: { athlete: true },
  })
  const coachTrends = await buildPerfTrends(coachPerfs)
  const sbCache = new Map<string, Set<string>>()
  const allPerformances: PerformanceWidgetItem[] = []
  for (const perf of coachPerfs) {
    if (!sbCache.has(perf.athleteId)) {
      sbCache.set(perf.athleteId, await getSeasonBestIds(perf.athleteId))
    }
    allPerformances.push(
      toWidgetPerf(
        perf,
        `${perf.athlete.firstName} ${perf.athlete.lastName}`,
        sbCache.get(perf.athleteId)!,
        coachTrends
      )
    )
  }

  let myPerformances: PerformanceWidgetItem[] = []
  if (linkedAthlete) {
    const myPerfs = await prisma.performance.findMany({
      where: { athleteId: linkedAthlete.id },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    })
    const [mySbIds, myTrends] = await Promise.all([
      getSeasonBestIds(linkedAthlete.id),
      buildPerfTrends(myPerfs),
    ])
    const athleteName = `${linkedAthlete.firstName} ${linkedAthlete.lastName}`
    myPerformances = myPerfs.map((p) => toWidgetPerf(p, athleteName, mySbIds, myTrends))
  }

  return { view: 'coach', hasLinkedAthlete: !!linkedAthlete, allPerformances, myPerformances }
}
