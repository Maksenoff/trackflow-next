import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { isTeamMember } from '@/lib/team-permissions'
import { teamPerformanceCreateSchema } from '@/lib/validations/team'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const staff = !!session && (isAdmin(session.user.roles) || isCoach(session.user.roles))
  const member = !staff && !!session && (await isTeamMember(session.user.id, params.id))
  if (!staff && !member) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamPerformanceCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const performance = await prisma.teamPerformance.create({
    data: {
      teamId: params.id,
      time: parsed.data.time,
      location: parsed.data.location ?? null,
      date: parsed.data.date,
      place: parsed.data.place ?? null,
    },
  })

  return NextResponse.json({ id: performance.id }, { status: 201 })
}
