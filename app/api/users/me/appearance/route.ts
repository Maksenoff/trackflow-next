import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { appearanceUpdateSchema } from '@/lib/validations/appearance'

// Préférence personnelle (pas un réglage club) : chacun ne modifie que son
// propre compte, jamais /api/users/[id]. La couleur d'accent est ouverte à
// tout le monde (fin de la bêta, décision Maksen 2026-09-19) ; seul
// `newUiEnabled` reste admin-only (bascule vers l'ancienne interface pour
// comparer/dépanner — sans effet pour les autres rôles, cf. app/(app)/layout.tsx).
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = appearanceUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { newUiEnabled, accentColor } = parsed.data

  if (newUiEnabled !== undefined && !isAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(newUiEnabled !== undefined && { newUiEnabled }),
      ...(accentColor !== undefined && { accentColor }),
    },
  })

  return NextResponse.json({ ok: true })
}
