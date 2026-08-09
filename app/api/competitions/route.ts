import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { competitionInputSchema } from '@/lib/validations/competition'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
}

export async function POST(request: Request) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = competitionInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const created = await prisma.competition.create({
    data: {
      title: data.title,
      date: new Date(data.date),
      location: data.location || null,
      competitionTypeId: data.competitionTypeId || null,
      description: data.description || null,
    },
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
