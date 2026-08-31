import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'

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

/** Utilisateurs sélectionnables comme coach d'une séance — rôle ROLE_COACH ou ROLE_ADMIN. */
export async function getCoachUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, roles: true },
    orderBy: { firstName: 'asc' },
  })
  return users
    .filter((u) => {
      const roles = JSON.parse(u.roles) as string[]
      return isCoach(roles) || isAdmin(roles)
    })
    .map((u) => ({ id: u.id, firstName: u.firstName }))
}

export async function getMonthSessions(year: number, month: number) {
  const { start, end } = monthRange(year, month)
  return prisma.session.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      trainingType: true,
      athleteSessions: { select: { id: true } },
      coach: { select: { id: true, firstName: true } },
    },
    orderBy: { date: 'asc' },
  })
}

export type MonthSession = Awaited<ReturnType<typeof getMonthSessions>>[number]

/**
 * Séances personnelles du mois — toujours restreintes à `athleteId` (l'athlète
 * voit les siennes sur son calendrier), sauf `includeAll` (coach/admin, filtre
 * "calendrier général" côté UI) qui les remonte pour tout le club avec le nom
 * de l'athlète attaché.
 */
export async function getMonthCustomSessions(
  year: number,
  month: number,
  athleteId: string | null,
  includeAll: boolean
) {
  if (!includeAll && !athleteId) return []
  const { start, end } = monthRange(year, month)
  return prisma.athleteCustomSession.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(includeAll ? {} : { athleteId: athleteId! }),
    },
    include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { date: 'asc' },
  })
}

export type MonthCustomSession = Awaited<ReturnType<typeof getMonthCustomSessions>>[number]

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

  const ffaCounts = await prisma.competitionRegistration.groupBy({
    by: ['competitionId'],
    where: { competitionId: { in: ids }, ffaRegistered: true },
    _count: true,
  })
  const ffaCountMap = new Map(ffaCounts.map((c) => [c.competitionId, c._count]))

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
    ffaRegisteredCount: ffaCountMap.get(c.id) ?? 0,
    isRegistered: registeredIds.has(c.id),
  }))
}

export type MonthCompetition = Awaited<ReturnType<typeof getMonthCompetitions>>[number]

export async function getSessionDetail(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      trainingType: true,
      coach: { select: { id: true, firstName: true } },
      athleteSessions: {
        include: { athlete: true },
        orderBy: { loggedAt: 'desc' },
      },
    },
  })
}

export type SessionDetail = NonNullable<Awaited<ReturnType<typeof getSessionDetail>>>

export async function getCustomSessionDetail(id: string) {
  return prisma.athleteCustomSession.findUnique({
    where: { id },
    include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
  })
}

export type CustomSessionDetail = NonNullable<Awaited<ReturnType<typeof getCustomSessionDetail>>>
