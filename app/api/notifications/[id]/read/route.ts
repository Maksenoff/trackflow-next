import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Les rappels "séance à débriefer" sont calculés à la volée (id préfixé "debrief-"),
  // rien à marquer en base pour eux.
  if (params.id.startsWith('debrief-')) {
    return NextResponse.json({ ok: true })
  }

  const notif = await prisma.notification.findUnique({ where: { id: params.id } })
  if (notif && notif.userId === session.user.id) {
    await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } })
  }

  return NextResponse.json({ ok: true })
}
