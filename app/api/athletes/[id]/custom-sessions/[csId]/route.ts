import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  customSessionInputSchema,
  customSessionRpeInputSchema,
} from '@/lib/validations/custom-session'

async function requireSelf(athleteId: string) {
  const session = await auth()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.linkedAthleteId !== athleteId) return null
  return session
}

/**
 * PATCH sert à la fois l'édition des infos (titre/date/heure/durée) et le
 * debrief (difficulté/commentaire/non effectuée) — les deux réservés à
 * l'athlète propriétaire, jamais le coach (contrairement aux séances coach où
 * le coach peut aussi saisir le ressenti).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; csId: string } }
) {
  const session = await requireSelf(params.id)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const existing = await prisma.athleteCustomSession.findUnique({ where: { id: params.csId } })
  if (!existing || existing.athleteId !== params.id) {
    return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
  }

  const body = await request.json()

  const infoParsed = customSessionInputSchema.partial().safeParse(body)
  const rpeParsed = customSessionRpeInputSchema.safeParse(body)
  if (!infoParsed.success && !rpeParsed.success) {
    return NextResponse.json({ error: infoParsed.error?.flatten() }, { status: 400 })
  }

  const info = infoParsed.success ? infoParsed.data : {}
  const rpe = rpeParsed.success ? rpeParsed.data : {}
  // Nécessaire pour reconstruire `startTime` (Date complète) si seule l'heure
  // change sans que la date soit renvoyée dans la même requête.
  const dateStr = info.date ?? existing.date.toISOString().slice(0, 10)

  const updated = await prisma.athleteCustomSession.update({
    where: { id: params.csId },
    data: {
      ...(info.title !== undefined && { title: info.title }),
      ...(info.date !== undefined && { date: new Date(info.date) }),
      ...(info.startTime !== undefined && {
        startTime: info.startTime ? new Date(`${dateStr}T${info.startTime}:00Z`) : null,
      }),
      ...(info.durationMinutes !== undefined && { durationMinutes: info.durationMinutes }),
      ...(info.description !== undefined && { description: info.description || null }),
      ...(rpe.difficulty !== undefined && { difficulty: rpe.skipped ? null : rpe.difficulty }),
      ...(rpe.comment !== undefined && { comment: rpe.comment }),
      ...(rpe.skipped !== undefined && { skipped: rpe.skipped }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; csId: string } }
) {
  const session = await requireSelf(params.id)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const existing = await prisma.athleteCustomSession.findUnique({ where: { id: params.csId } })
  if (!existing || existing.athleteId !== params.id) {
    return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
  }

  await prisma.athleteCustomSession.delete({ where: { id: params.csId } })
  return NextResponse.json({ ok: true })
}
