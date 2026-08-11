import { prisma } from '@/lib/prisma'
import { fullName } from '@/lib/athlete'

export async function getAthletesList(query?: string) {
  const athletes = await prisma.athlete.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      _count: { select: { athleteSessions: true, performances: true, goals: true } },
    },
  })

  const mapped = athletes.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    photoUrl: a.photoUrl,
    bannerUrl: a.bannerUrl,
    bannerConfig: JSON.parse(a.bannerConfig) as {
      mode?: 'pattern' | 'photo'
      pattern?: string
      color?: string
      zoom?: number
    },
    birthDate: a.birthDate,
    gender: a.gender,
    disciplines: JSON.parse(a.disciplines) as string[],
    disciplineColors: JSON.parse(a.disciplineColors) as Record<string, string>,
    sessionsCount: a._count.athleteSessions,
    performancesCount: a._count.performances,
    goalsCount: a._count.goals,
  }))

  if (!query) return mapped
  const q = query.trim().toLowerCase()
  if (!q) return mapped
  return mapped.filter((a) => fullName(a.firstName, a.lastName).toLowerCase().includes(q))
}

export async function getAthleteDetail(id: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      performances: { orderBy: { recordedAt: 'desc' } },
      goals: { orderBy: { createdAt: 'desc' } },
      athleteSessions: {
        orderBy: { loggedAt: 'desc' },
        include: { session: { include: { trainingType: true } } },
      },
      customSessions: { orderBy: { performedAt: 'desc' } },
      videos: { orderBy: { createdAt: 'desc' } },
      notesList: { orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] },
      competitionRegistrations: {
        orderBy: { registeredAt: 'desc' },
        include: { competition: { include: { competitionType: true } }, debrief: true },
      },
      user: { select: { id: true } },
    },
  })
  if (!athlete) return null

  return {
    ...athlete,
    disciplines: JSON.parse(athlete.disciplines) as string[],
    disciplineColors: JSON.parse(athlete.disciplineColors) as Record<string, string>,
    bannerConfig: JSON.parse(athlete.bannerConfig) as {
      mode?: 'pattern' | 'photo'
      pattern?: string
      color?: string
      zoom?: number
      x?: number
      y?: number
    },
    photoConfig: JSON.parse(athlete.photoConfig) as {
      zoom?: number
      x?: number
      y?: number
    },
  }
}

export type AthleteDetail = NonNullable<Awaited<ReturnType<typeof getAthleteDetail>>>
