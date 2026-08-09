import { prisma } from '@/lib/prisma'

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  return { start, end }
}

export async function getTrainingTypes() {
  return prisma.trainingType.findMany({ orderBy: { name: 'asc' } })
}

export async function getCompetitionTypes() {
  return prisma.competitionType.findMany({ orderBy: { name: 'asc' } })
}

export async function getMonthSessions(year: number, month: number) {
  const { start, end } = monthRange(year, month)
  return prisma.session.findMany({
    where: { date: { gte: start, lte: end } },
    include: { trainingType: true, athleteSessions: { select: { id: true } } },
    orderBy: { date: 'asc' },
  })
}

export type MonthSession = Awaited<ReturnType<typeof getMonthSessions>>[number]

export async function getMonthCompetitions(year: number, month: number, athleteId?: string | null) {
  const { start, end } = monthRange(year, month)
  const competitions = await prisma.competition.findMany({
    where: { date: { gte: start, lte: end } },
    include: { competitionType: true },
    orderBy: { date: 'asc' },
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
    ...c,
    registrationCount: countMap.get(c.id) ?? 0,
    isRegistered: registeredIds.has(c.id),
  }))
}

export type MonthCompetition = Awaited<ReturnType<typeof getMonthCompetitions>>[number]

export async function getSessionDetail(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      trainingType: true,
      athleteSessions: {
        include: { athlete: true },
        orderBy: { loggedAt: 'desc' },
      },
    },
  })
}

export type SessionDetail = NonNullable<Awaited<ReturnType<typeof getSessionDetail>>>
