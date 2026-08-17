import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { typeInputSchema } from '@/lib/validations/type'

function canManage(roles: string[]) {
  return isAdmin(roles) || isCoach(roles)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = typeInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const type = await prisma.trainingType.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(type)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !canManage(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.trainingType.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
