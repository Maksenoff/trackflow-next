import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { userPasswordResetSchema } from '@/lib/validations/user'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || !isAdmin(session.user.roles ?? [])) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = userPasswordResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10)
  await prisma.user.update({ where: { id: params.id }, data: { password: hashed } })

  return NextResponse.json({ ok: true })
}
