import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { athleteInputSchema } from '@/lib/validations/athlete'
import { reconcileDisciplineColors } from '@/lib/disciplines'

// Modifier un profil athlète est réservé à l'admin, ou à l'athlète lui-même pour
// son propre profil — un coach gère séances/compétitions mais pas les profils.
async function canEdit(athleteId: string) {
  const session = await auth()
  if (!session) return false
  const roles = session.user.roles ?? []
  if (isAdmin(roles)) return true
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

  // L'activation de l'onglet Vidéos est réservée aux admins.
  if (data.videosEnabled !== undefined) {
    const session = await auth()
    if (!isAdmin(session?.user.roles ?? [])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  // Réconciliation disciplines/disciplineColors : PATCH étant partiel, l'un des
  // deux peut arriver sans l'autre (ex: reorder qui ne touche que `disciplines`)
  // — recharger l'existant pour ne jamais réconcilier contre une moitié absente
  // et écraser des couleurs valides.
  let disciplineColorsToSave: string | undefined
  if (data.disciplines !== undefined || data.disciplineColors !== undefined) {
    const current = await prisma.athlete.findUnique({
      where: { id: params.id },
      select: { disciplines: true, disciplineColors: true },
    })
    const disciplines: string[] =
      data.disciplines ?? (current ? JSON.parse(current.disciplines) : [])
    const colors: Record<string, string> =
      data.disciplineColors ?? (current ? JSON.parse(current.disciplineColors) : {})
    disciplineColorsToSave = JSON.stringify(reconcileDisciplineColors(disciplines, colors))
  }

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
      ...(data.ffaSyncSinceYear !== undefined && { ffaSyncSinceYear: data.ffaSyncSinceYear }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.disciplines !== undefined && { disciplines: JSON.stringify(data.disciplines) }),
      ...(disciplineColorsToSave !== undefined && {
        disciplineColors: disciplineColorsToSave,
      }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      ...(data.photoConfig !== undefined && { photoConfig: JSON.stringify(data.photoConfig) }),
      ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
      ...(data.bannerConfig !== undefined && { bannerConfig: JSON.stringify(data.bannerConfig) }),
      ...(data.videosEnabled !== undefined && { videosEnabled: data.videosEnabled }),
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
