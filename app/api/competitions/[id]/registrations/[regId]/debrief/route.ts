import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { competitionDebriefInputSchema } from '@/lib/validations/competition-debrief'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
}

export async function POST(request: Request, { params }: { params: { regId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const roles = session.user.roles ?? []

  const registration = await prisma.competitionRegistration.findUnique({
    where: { id: params.regId },
  })
  if (!registration) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  if (!canManage(roles)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.linkedAthleteId !== registration.athleteId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const body = await request.json()
  const parsed = competitionDebriefInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const feeling = data.skipped ? null : (data.feeling ?? null)

  const debrief = await prisma.competitionDebrief.upsert({
    where: { registrationId: params.regId },
    create: {
      registrationId: params.regId,
      feeling,
      notes: data.notes ?? null,
      skipped: data.skipped,
    },
    update: {
      feeling,
      notes: data.notes ?? null,
      skipped: data.skipped,
    },
  })

  return NextResponse.json(debrief)
}
