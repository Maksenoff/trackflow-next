import { prisma } from '@/lib/prisma'

export async function getTeamsList() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        orderBy: [{ relayOrder: 'asc' }, { addedAt: 'asc' }],
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
    discipline: t.discipline,
    color: t.color,
    photoUrl: t.photoUrl,
    photoConfig: JSON.parse(t.photoConfig) as { zoom?: number; x?: number; y?: number },
    createdAt: t.createdAt,
    members: t.members.map((m) => ({
      id: m.athlete.id,
      firstName: m.athlete.firstName,
      lastName: m.athlete.lastName,
      photoUrl: m.athlete.photoUrl,
      photoConfig: JSON.parse(m.athlete.photoConfig) as { zoom?: number; x?: number; y?: number },
      relayOrder: m.relayOrder,
    })),
  }))
}

export async function getTeamDetail(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ relayOrder: 'asc' }, { addedAt: 'asc' }],
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
              licenseNumber: true,
            },
          },
        },
      },
      performances: { orderBy: { date: 'desc' } },
    },
  })
  if (!team) return null

  return {
    id: team.id,
    name: team.name,
    discipline: team.discipline,
    createdByUserId: team.createdByUserId,
    color: team.color,
    photoUrl: team.photoUrl,
    photoConfig: JSON.parse(team.photoConfig) as { zoom?: number; x?: number; y?: number },
    createdAt: team.createdAt,
    members: team.members.map((m) => ({
      id: m.athlete.id,
      firstName: m.athlete.firstName,
      lastName: m.athlete.lastName,
      photoUrl: m.athlete.photoUrl,
      photoConfig: JSON.parse(m.athlete.photoConfig) as { zoom?: number; x?: number; y?: number },
      disciplines: JSON.parse(m.athlete.disciplines) as string[],
      disciplineColors: JSON.parse(m.athlete.disciplineColors) as Record<string, string>,
      licenseNumber: m.athlete.licenseNumber,
      relayOrder: m.relayOrder,
      handoffMark: m.handoffMark,
    })),
    performances: team.performances.map((p) => ({
      id: p.id,
      time: p.time,
      location: p.location,
      date: p.date,
      place: p.place,
    })),
  }
}

export type TeamDetail = NonNullable<Awaited<ReturnType<typeof getTeamDetail>>>
export type TeamDetailMember = TeamDetail['members'][number]
export type TeamPerformanceEntry = TeamDetail['performances'][number]
