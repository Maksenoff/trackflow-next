import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { teamUpdateSchema } from '@/lib/validations/team'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (!isAdmin(session.user.roles) && !isCoach(session.user.roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.team.update({ where: { id: params.id }, data: { name: parsed.data.name } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (!isAdmin(session.user.roles) && !isCoach(session.user.roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.team.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
