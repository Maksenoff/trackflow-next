import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { customSessionInputSchema } from '@/lib/validations/custom-session'

/**
 * Séances personnelles : uniquement l'athlète lui-même, jamais le coach/admin —
 * ce sont ses propres séances ajoutées en dehors du programme du coach (voir
 * calendar-view.tsx pour l'affichage, sessions-tab.tsx pour le debrief).
 */
async function requireSelf(athleteId: string) {
  const session = await auth()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.linkedAthleteId !== athleteId) return null
  return session
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSelf(params.id)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = customSessionInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const created = await prisma.athleteCustomSession.create({
    data: {
      athleteId: params.id,
      title: data.title,
      date: new Date(data.date),
      // "Z" explicite — heure murale naïve, cf. app/api/sessions/route.ts.
      startTime: data.startTime ? new Date(`${data.date}T${data.startTime}:00Z`) : null,
      durationMinutes: data.durationMinutes ?? null,
      description: data.description || null,
    },
  })

  return NextResponse.json(created, { status: 201 })
}
