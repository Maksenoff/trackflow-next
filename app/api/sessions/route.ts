import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { sessionInputSchema } from '@/lib/validations/session'

export async function POST(request: Request) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isCoach(roles) && !isAdmin(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sessionInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const created = await prisma.session.create({
    data: {
      title: data.title,
      date: new Date(data.date),
      // "Z" explicite : l'heure saisie est une heure murale "naïve", jamais une
      // vraie conversion de fuseau — sans le Z, la construction dépendait du fuseau
      // du serveur au moment du build (correctif "19h saisi -> 21h affiché" en prod).
      startTime: data.startTime ? new Date(`${data.date}T${data.startTime}:00Z`) : null,
      durationMinutes: data.durationMinutes ?? null,
      trainingTypeId: data.trainingTypeId || null,
      description: data.description ?? null,
      // Par défaut, le créateur de la séance est le coach renseigné.
      coachId: data.coachId !== undefined ? data.coachId || null : session.user.id,
      coachPresent: data.coachPresent ?? true,
    },
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
