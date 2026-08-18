import { prisma } from '@/lib/prisma'

export async function getTeamsList() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        orderBy: { addedAt: 'asc' },
        include: {
          athlete: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              photoConfig: true,
            },
          },
        },
      },
    },
  })

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    members: t.members.map((m) => ({
      id: m.athlete.id,
      firstName: m.athlete.firstName,
      lastName: m.athlete.lastName,
      photoUrl: m.athlete.photoUrl,
      photoConfig: JSON.parse(m.athlete.photoConfig) as { zoom?: number; x?: number; y?: number },
    })),
  }))
}

export async function getTeamDetail(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { addedAt: 'asc' },
        include: {
          athlete: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              photoConfig: true,
              disciplines: true,
              disciplineColors: true,
            },
          },
        },
      },
    },
  })
  if (!team) return null

  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt,
    members: team.members.map((m) => ({
      id: m.athlete.id,
      firstName: m.athlete.firstName,
      lastName: m.athlete.lastName,
      photoUrl: m.athlete.photoUrl,
      photoConfig: JSON.parse(m.athlete.photoConfig) as { zoom?: number; x?: number; y?: number },
      disciplines: JSON.parse(m.athlete.disciplines) as string[],
      disciplineColors: JSON.parse(m.athlete.disciplineColors) as Record<string, string>,
    })),
  }
}

export type TeamDetail = NonNullable<Awaited<ReturnType<typeof getTeamDetail>>>
