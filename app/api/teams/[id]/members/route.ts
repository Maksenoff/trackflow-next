import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { teamMemberAddSchema } from '@/lib/validations/team'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (!isAdmin(session.user.roles) && !isCoach(session.user.roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamMemberAddSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.teamMember.upsert({
    where: { teamId_athleteId: { teamId: params.id, athleteId: parsed.data.athleteId } },
    update: {},
    create: { teamId: params.id, athleteId: parsed.data.athleteId },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
