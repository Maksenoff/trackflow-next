import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { athleteInputSchema } from '@/lib/validations/athlete'

export async function POST(request: Request) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isCoach(roles) && !isAdmin(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = athleteInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const athlete = await prisma.athlete.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      gender: data.gender ?? null,
      licenseNumber: data.licenseNumber ?? null,
      ffaProfileUrl: data.ffaProfileUrl ?? null,
      notes: data.notes ?? null,
      disciplines: JSON.stringify(data.disciplines),
      disciplineColors: JSON.stringify(data.disciplineColors),
      photoUrl: data.photoUrl ?? null,
      photoConfig: JSON.stringify(data.photoConfig),
      bannerUrl: data.bannerUrl ?? null,
      bannerConfig: JSON.stringify(data.bannerConfig),
    },
  })

  return NextResponse.json({ id: athlete.id }, { status: 201 })
}
