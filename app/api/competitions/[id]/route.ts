import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager } from '@/lib/roles'
import { competitionInputSchema } from '@/lib/validations/competition'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = competitionInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const updated = await prisma.competition.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.competitionTypeId !== undefined && {
        competitionTypeId: data.competitionTypeId || null,
      }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
      ...(data.documentUrl !== undefined && { documentUrl: data.documentUrl || null }),
      ...(data.schedulesUrl !== undefined && { schedulesUrl: data.schedulesUrl || null }),
      ...(data.availableDisciplines !== undefined && {
        availableDisciplines: JSON.stringify(data.availableDisciplines),
      }),
      ...(data.requestExpectedPerf !== undefined && {
        requestExpectedPerf: data.requestExpectedPerf,
      }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.competition.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
