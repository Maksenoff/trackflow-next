import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { athleteInputSchema } from '@/lib/validations/athlete'

async function canEdit(athleteId: string) {
  const session = await auth()
  if (!session) return false
  const roles = session.user.roles ?? []
  if (isCoach(roles) || isAdmin(roles)) return true
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  return user?.linkedAthleteId === athleteId
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await canEdit(params.id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = athleteInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const athlete = await prisma.athlete.update({
    where: { id: params.id },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.birthDate !== undefined && {
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
      ...(data.ffaProfileUrl !== undefined && { ffaProfileUrl: data.ffaProfileUrl }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.disciplines !== undefined && { disciplines: JSON.stringify(data.disciplines) }),
      ...(data.disciplineColors !== undefined && {
        disciplineColors: JSON.stringify(data.disciplineColors),
      }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
      ...(data.bannerConfig !== undefined && { bannerConfig: JSON.stringify(data.bannerConfig) }),
    },
  })

  return NextResponse.json({ id: athlete.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !isAdmin(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.athlete.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
