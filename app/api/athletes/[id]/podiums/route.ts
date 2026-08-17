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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await canEdit(params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = podiumInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const podium = await prisma.podium.create({
    data: {
      athleteId: params.id,
      year: data.year,
      rank: data.rank,
      level: data.level,
      discipline: data.discipline,
      performance: data.performance || null,
      recordedAt: new Date(data.recordedAt),
      venue: data.venue || null,
      source: 'manual',
    },
  })

  return NextResponse.json({ id: podium.id }, { status: 201 })
}
