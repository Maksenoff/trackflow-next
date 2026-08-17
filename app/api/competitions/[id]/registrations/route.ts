import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { competitionRegistrationInputSchema } from '@/lib/validations/competition'
import { notifyAthleteRegistered } from '@/lib/notifications'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const roles = session.user.roles ?? []

  const body = await request.json()
  const parsed = competitionRegistrationInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  if (!canManage(roles)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.linkedAthleteId !== data.athleteId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const existing = await prisma.competitionRegistration.findUnique({
    where: { athleteId_competitionId: { athleteId: data.athleteId, competitionId: params.id } },
  })
  const isNew = !existing

  const registration = await prisma.competitionRegistration.upsert({
    where: { athleteId_competitionId: { athleteId: data.athleteId, competitionId: params.id } },
    create: {
      athleteId: data.athleteId,
      competitionId: params.id,
      disciplines: JSON.stringify(data.disciplines),
      ffaRegistered: data.ffaRegistered ?? false,
      expectedPerformances: data.expectedPerformances
        ? JSON.stringify(data.expectedPerformances)
        : null,
    },
    update: {
      disciplines: JSON.stringify(data.disciplines),
      ffaRegistered: data.ffaRegistered ?? false,
      expectedPerformances: data.expectedPerformances
        ? JSON.stringify(data.expectedPerformances)
        : null,
    },
  })

  if (isNew) {
    const [athlete, competition, staff] = await Promise.all([
      prisma.athlete.findUnique({ where: { id: data.athleteId } }),
      prisma.competition.findUnique({ where: { id: params.id } }),
      prisma.user.findMany(),
    ])
    if (athlete && competition) {
      const competitionUrl = `/competitions/${competition.id}`
      const athleteName = `${athlete.firstName} ${athlete.lastName}`
      const recipients = staff.filter((u) => {
        if (u.id === session.user.id) return false
        const userRoles = JSON.parse(u.roles) as string[]
        return isAdmin(userRoles) || isCoach(userRoles)
      })
      await Promise.all(
        recipients.map((u) =>
          notifyAthleteRegistered(u.id, athleteName, competition.title, competitionUrl)
        )
      )
    }
  }

  return NextResponse.json({ id: registration.id }, { status: 201 })
}
