import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { pollUpdateSchema } from '@/lib/validations/poll'

// Modifier un vote (dates, libellés des options) : l'auteur pour son propre
// vote, l'admin pour n'importe lequel — demande explicite de Maksen le
// 2026-08-29 (ex: prolonger un vote de x jours). Le pinnedOrder (épinglage)
// se gère à part (POST/DELETE /api/polls/[id]/pin), réservé admin.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { options: true },
  })
  if (!poll) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
  const canEdit = isAdmin(session.user.roles) || poll.createdById === session.user.id
  if (!canEdit) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = pollUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { startsAt, expiresAt, options } = parsed.data

  const nextStartsAt = startsAt ?? poll.startsAt
  const nextExpiresAt = expiresAt ?? poll.expiresAt
  if (nextExpiresAt.getTime() <= nextStartsAt.getTime()) {
    return NextResponse.json(
      {
        error: {
          formErrors: [],
          fieldErrors: { expiresAt: ['La date de fin doit être après la date de début.'] },
        },
      },
      { status: 400 }
    )
  }

  if (options) {
    const validIds = new Set(poll.options.map((o) => o.id))
    if (options.some((o) => !validIds.has(o.id))) {
      return NextResponse.json({ error: 'Option inconnue.' }, { status: 400 })
    }
  }

  await prisma.$transaction([
    prisma.poll.update({
      where: { id: params.id },
      data: {
        ...(startsAt !== undefined && { startsAt }),
        ...(expiresAt !== undefined && { expiresAt }),
      },
    }),
    ...(options
      ? options.map((o) =>
          prisma.pollOption.update({ where: { id: o.id }, data: { label: o.label } })
        )
      : []),
  ])

  return NextResponse.json({ ok: true })
}

// Annule un duel : supprime le Poll (cascade sur PollOption/PollVote), ce qui
// libère automatiquement les deux suggestions — elles redeviennent sélectionnables
// dans /admin/feedbacks puisque PollOption.feedbackId n'existe plus.
// Staff toujours, ou l'auteur de la création pour son propre vote (même
// principe que la suppression d'équipe).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (!isAdmin(session.user.roles)) {
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    })
    if (!poll || poll.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  await prisma.poll.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
