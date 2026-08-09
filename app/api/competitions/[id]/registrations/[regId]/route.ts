import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
}

const patchSchema = z.object({
  disciplines: z.array(z.string()).min(1).optional(),
  ffaRegistered: z.boolean().optional(),
  expectedPerformances: z.record(z.string(), z.string()).optional().nullable(),
})

export async function PATCH(request: Request, { params }: { params: { regId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const roles = session.user.roles ?? []

  const registration = await prisma.competitionRegistration.findUnique({
    where: { id: params.regId },
  })
  if (!registration) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  // Le badge FFA est réservé au coach/admin/gest. compétitions.
  if (data.ffaRegistered !== undefined && !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  if (!canManage(roles)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.linkedAthleteId !== registration.athleteId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const updated = await prisma.competitionRegistration.update({
    where: { id: params.regId },
    data: {
      ...(data.disciplines !== undefined && { disciplines: JSON.stringify(data.disciplines) }),
      ...(data.ffaRegistered !== undefined && { ffaRegistered: data.ffaRegistered }),
      ...(data.expectedPerformances !== undefined && {
        expectedPerformances: data.expectedPerformances
          ? JSON.stringify(data.expectedPerformances)
          : null,
      }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(_request: Request, { params }: { params: { regId: string } }) {
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

  await prisma.competitionRegistration.delete({ where: { id: params.regId } })
  return NextResponse.json({ ok: true })
}
