import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { competitionRegistrationInputSchema } from '@/lib/validations/competition'

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

  return NextResponse.json({ id: registration.id }, { status: 201 })
}
