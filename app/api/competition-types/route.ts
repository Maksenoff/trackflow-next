import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { typeInputSchema } from '@/lib/validations/type'

export async function POST(request: Request) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isAdmin(roles) && !isCoach(roles) && !isCompetitionManager(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = typeInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const type = await prisma.competitionType.create({ data: parsed.data })
  return NextResponse.json(type, { status: 201 })
}
