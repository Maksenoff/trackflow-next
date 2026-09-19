import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { preferencesUpdateSchema } from '@/lib/validations/preferences'

// Préférences d'affichage personnelles ouvertes à tout utilisateur connecté
// (contrairement à /api/users/me/appearance, réservé admin car lié à la
// nouvelle interface bêta) : chacun ne modifie que son propre compte.
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = preferencesUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { calendarView } = parsed.data

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(calendarView !== undefined && { calendarView }),
    },
  })

  return NextResponse.json({ ok: true })
}
