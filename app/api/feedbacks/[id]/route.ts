import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { feedbackNoteSchema, feedbackStatusSchema } from '@/lib/validations/feedback'
import { notifyFeedbackUpdated } from '@/lib/notifications'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()

  if (body.status !== undefined) {
    const parsed = feedbackStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const status = parsed.data.status

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'done' && { resolvedAt: new Date() }),
      },
    })

    if (feedback.authorId && (status === 'in_progress' || status === 'done')) {
      await notifyFeedbackUpdated(feedback.authorId, status, feedback.id)
    }

    return NextResponse.json({ id: feedback.id, status: feedback.status })
  }

  if (body.adminNote !== undefined) {
    const parsed = feedbackNoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: { adminNote: parsed.data.adminNote || null },
    })

    return NextResponse.json({ id: feedback.id })
  }

  return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.feedback.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
