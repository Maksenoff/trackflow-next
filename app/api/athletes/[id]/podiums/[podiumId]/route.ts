import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { podiumInputSchema } from '@/lib/validations/podium'

async function canEdit(athleteId: string) {
  const session = await auth()
  if (!session) return false
  const roles = session.user.roles ?? []
  if (isCoach(roles) || isAdmin(roles)) return true
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  return user?.linkedAthleteId === athleteId
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; podiumId: string } }
) {
  if (!(await canEdit(params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const existing = await prisma.podium.findUnique({ where: { id: params.podiumId } })
  if (!existing || existing.athleteId !== params.id) {
    return NextResponse.json({ error: 'Podium introuvable' }, { status: 404 })
  }
  if (existing.source !== 'manual') {
    return NextResponse.json(
      { error: 'Seuls les podiums ajoutés manuellement peuvent être modifiés.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const parsed = podiumInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const podium = await prisma.podium.update({
    where: { id: params.podiumId },
    data: {
      ...(data.year !== undefined && { year: data.year }),
      ...(data.rank !== undefined && { rank: data.rank }),
      ...(data.level !== undefined && { level: data.level }),
      ...(data.discipline !== undefined && { discipline: data.discipline }),
      ...(data.performance !== undefined && { performance: data.performance || null }),
      ...(data.recordedAt !== undefined && { recordedAt: new Date(data.recordedAt) }),
      ...(data.venue !== undefined && { venue: data.venue || null }),
    },
  })

  return NextResponse.json({ id: podium.id })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; podiumId: string } }
) {
  if (!(await canEdit(params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const existing = await prisma.podium.findUnique({ where: { id: params.podiumId } })
  if (!existing || existing.athleteId !== params.id) {
    return NextResponse.json({ error: 'Podium introuvable' }, { status: 404 })
  }
  if (existing.source !== 'manual') {
    return NextResponse.json(
      { error: 'Seuls les podiums ajoutés manuellement peuvent être supprimés.' },
      { status: 400 }
    )
  }

  await prisma.podium.delete({ where: { id: params.podiumId } })
  return NextResponse.json({ ok: true })
}
