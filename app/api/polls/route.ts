import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { pollCreateSchema } from '@/lib/validations/poll'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = pollCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { startsAt, expiresAt, options } = parsed.data

  // Deux options avec feedbackId -> duel "suggestions" (staff uniquement,
  // logique d'origine). Deux sans -> duel libre, ouvert à tout utilisateur
  // connecté (demande explicite de Maksen le 2026-08-29). Un mélange des deux
  // est déjà rejeté par le schéma (refine), donc juste vérifier ici lequel des
  // deux cas on a.
  const isFeedbackDuel = !!options[0].feedbackId

  if (isFeedbackDuel) {
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const feedbackIds = options.map((o) => o.feedbackId!)
    const feedbacks = await prisma.feedback.findMany({
      where: { id: { in: feedbackIds } },
      include: { pollOption: true },
    })
    if (feedbacks.length !== 2) {
      return NextResponse.json({ error: 'Suggestion introuvable.' }, { status: 404 })
    }
    if (feedbacks.some((f) => f.pollOption)) {
      return NextResponse.json(
        { error: 'Une de ces suggestions est déjà utilisée dans un vote.' },
        { status: 400 }
      )
    }
  }

  const poll = await prisma.poll.create({
    data: {
      startsAt,
      expiresAt,
      createdById: session.user.id,
      options: {
        create: options.map((o) => ({ feedbackId: o.feedbackId ?? null, label: o.label })),
      },
    },
  })

  return NextResponse.json({ id: poll.id }, { status: 201 })
}
