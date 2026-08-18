import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Rappel calculé à la volée ("séance à débriefer", "séance dans 2h"...) : pas de
  // ligne Notification, on retient juste que l'utilisateur l'a masqué.
  const SYNTHETIC_PREFIXES = ['debrief-', 'session-soon-']
  if (SYNTHETIC_PREFIXES.some((p) => params.id.startsWith(p))) {
    await prisma.dismissedReminder.upsert({
      where: { userId_key: { userId: session.user.id, key: params.id } },
      create: { userId: session.user.id, key: params.id },
      update: {},
    })
    return NextResponse.json({ ok: true })
  }

  const notif = await prisma.notification.findUnique({ where: { id: params.id } })
  if (notif && notif.userId === session.user.id) {
    await prisma.notification.delete({ where: { id: params.id } })
  }

  return NextResponse.json({ ok: true })
}
