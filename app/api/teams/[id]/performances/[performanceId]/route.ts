import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { isTeamMember } from '@/lib/team-permissions'
import { teamPerformanceUpdateSchema } from '@/lib/validations/team'

async function canEdit(userId: string | undefined, roles: string[] | undefined, teamId: string) {
  if (!userId) return false
  if (isAdmin(roles ?? []) || isCoach(roles ?? [])) return true
  return isTeamMember(userId, teamId)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; performanceId: string } }
) {
  const session = await auth()
  if (!(await canEdit(session?.user.id, session?.user.roles, params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamPerformanceUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.teamPerformance.update({
    where: { id: params.performanceId },
    data: {
      time: parsed.data.time,
      location: parsed.data.location ?? null,
      date: parsed.data.date,
      place: parsed.data.place ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; performanceId: string } }
) {
  const session = await auth()
  if (!(await canEdit(session?.user.id, session?.user.roles, params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.teamPerformance.delete({ where: { id: params.performanceId } })
  return NextResponse.json({ ok: true })
}
