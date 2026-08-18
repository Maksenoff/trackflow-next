import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// Annule un duel : supprime le Poll (cascade sur PollOption/PollVote), ce qui
// libère automatiquement les deux suggestions — elles redeviennent sélectionnables
// dans /admin/feedbacks puisque PollOption.feedbackId n'existe plus.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.poll.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
