import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, ROLES } from '@/lib/roles'
import { userUpdateSchema } from '@/lib/validations/user'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || !isAdmin(session.user.roles ?? [])) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = userUpdateSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const isSelf = params.id === session.user.id
  const wasAdmin = (JSON.parse(target.roles) as string[]).includes(ROLES.ADMIN)
  if (isSelf && wasAdmin && data.roles !== undefined && !data.roles.includes(ROLES.ADMIN)) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas retirer votre propre rôle Administrateur.' },
      { status: 400 }
    )
  }

  if (data.linkedAthleteId !== undefined && data.linkedAthleteId !== null) {
    await prisma.user.updateMany({
      where: { linkedAthleteId: data.linkedAthleteId, NOT: { id: params.id } },
      data: { linkedAthleteId: null },
    })
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.roles !== undefined && { roles: JSON.stringify(data.roles) }),
        ...(data.linkedAthleteId !== undefined && { linkedAthleteId: data.linkedAthleteId }),
      },
    })
    return NextResponse.json({ id: user.id })
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà.' }, { status: 400 })
    }
    throw err
  }
}
