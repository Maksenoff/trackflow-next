import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { rpeInputSchema } from '@/lib/validations/rpe'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const roles = session.user.roles ?? []

  const body = await request.json()
  const parsed = rpeInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  if (!isCoach(roles) && !isAdmin(roles)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.linkedAthleteId !== data.athleteId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const difficulty = data.skipped ? null : (data.difficulty ?? null)

  const athleteSession = await prisma.athleteSession.upsert({
    where: { athleteId_sessionId: { athleteId: data.athleteId, sessionId: params.id } },
    create: {
      athleteId: data.athleteId,
      sessionId: params.id,
      difficulty,
      comment: data.comment ?? null,
      skipped: data.skipped,
    },
    update: {
      difficulty,
      comment: data.comment ?? null,
      skipped: data.skipped,
    },
  })

  return NextResponse.json(athleteSession)
}
