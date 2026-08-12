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
  trainingType: { name: string; color: string } | null
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
  /** Couleur choisie par l'athlète pour cette discipline (null si non spécialiste). */
  color: string | null
}

async function getUpcomingSessions(limit = 4): Promise<SessionWidgetItem[]> {
  const sessions = await prisma.session.findMany({
    where: { date: { gte: startOfToday() } },
    orderBy: { date: 'asc' },
    take: limit,
    include: { trainingType: true },
  })
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date,
    description: s.description,
    trainingType: s.trainingType
      ? { name: s.trainingType.name, color: s.trainingType.color }
      : null,
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
  trends: Map<string, Trend>,
  disciplineColors: Record<string, string>
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
    color: disciplineColors[perf.discipline] ?? null,
  }
}

export type AthleteDashboardData = {
  view: 'athlete'
  hasLinkedAthlete: boolean
  nextSession: SessionWidgetItem | null
  upcomingSessions: SessionWidgetItem[]
  nextCompetition: CompetitionWidgetItem | null
  upcomingCompetitions: CompetitionWidgetItem[]
  recentPerformances: PerformanceWidgetItem[]
}

export type CoachDashboardData = {
  view: 'coach'
  totalAthletes: number
  nextSession: SessionWidgetItem | null
  upcomingSessions: SessionWidgetItem[]
  nextCompetition: CompetitionWidgetItem | null
  upcomingCompetitions: CompetitionWidgetItem[]
  allPerformances: PerformanceWidgetItem[]
  myPerformances: PerformanceWidgetItem[]
  hasLinkedAthlete: boolean
}

export async function getDashboardData(
  userId: string,
  roles: string[]
): Promise<AthleteDashboardData | CoachDashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linkedAthlete: true },
  })
  const linkedAthlete = user?.linkedAthlete ?? null

  // Un utilisateur Admin/Coach voit toujours la vue coach, même s'il a aussi ROLE_ATHLETE
  const pureAthlete = isAthlete(roles) && !isCoach(roles) && !isAdmin(roles)

  if (pureAthlete) {
    const [upcomingSessions, upcomingCompetitions] = await Promise.all([
      getUpcomingSessions(4),
      getUpcomingCompetitions(linkedAthlete?.id ?? null, 4),
    ])

    if (!linkedAthlete) {
      return {
        view: 'athlete',
        hasLinkedAthlete: false,
        nextSession: upcomingSessions[0] ?? null,
        upcomingSessions,
        nextCompetition: upcomingCompetitions[0] ?? null,
        upcomingCompetitions,
        recentPerformances: [],
      }
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
    const disciplineColors = JSON.parse(linkedAthlete.disciplineColors) as Record<string, string>

    return {
      view: 'athlete',
      hasLinkedAthlete: true,
      nextSession: upcomingSessions[0] ?? null,
      upcomingSessions,
      nextCompetition: upcomingCompetitions[0] ?? null,
      upcomingCompetitions,
      recentPerformances: perfs.map((p) =>
        toWidgetPerf(p, athleteName, sbIds, trends, disciplineColors)
      ),
    }
  }

  // Vue coach / admin
  const [totalAthletes, upcomingSessions, upcomingCompetitions, coachPerfs] = await Promise.all([
    prisma.athlete.count(),
    getUpcomingSessions(4),
    getUpcomingCompetitions(linkedAthlete?.id ?? null, 4),
    prisma.performance.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: { athlete: true },
    }),
  ])

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
        coachTrends,
        JSON.parse(perf.athlete.disciplineColors) as Record<string, string>
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
    const disciplineColors = JSON.parse(linkedAthlete.disciplineColors) as Record<string, string>
    myPerformances = myPerfs.map((p) =>
      toWidgetPerf(p, athleteName, mySbIds, myTrends, disciplineColors)
    )
  }

  return {
    view: 'coach',
    totalAthletes,
    nextSession: upcomingSessions[0] ?? null,
    upcomingSessions,
    nextCompetition: upcomingCompetitions[0] ?? null,
    upcomingCompetitions,
    allPerformances,
    myPerformances,
    hasLinkedAthlete: !!linkedAthlete,
  }
}
