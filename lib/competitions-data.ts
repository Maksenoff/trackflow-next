import { prisma } from '@/lib/prisma'

export async function getCompetitionDetail(id: string) {
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      competitionType: true,
      registrations: {
        orderBy: { registeredAt: 'asc' },
        include: { athlete: true, debrief: true },
      },
    },
  })
  if (!competition) return null

  return {
    ...competition,
    availableDisciplines: JSON.parse(competition.availableDisciplines) as string[],
  }
}

export type CompetitionDetail = NonNullable<Awaited<ReturnType<typeof getCompetitionDetail>>>

export async function getAthletesForRegistration(excludeCompetitionId: string) {
  const athletes = await prisma.athlete.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    where: { competitionRegistrations: { none: { competitionId: excludeCompetitionId } } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      licenseNumber: true,
      disciplines: true,
    },
  })
  return athletes.map((a) => ({ ...a, disciplines: JSON.parse(a.disciplines) as string[] }))
}
