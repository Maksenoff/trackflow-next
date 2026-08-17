import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const notif = await prisma.notification.findUnique({ where: { id: params.id } })
  if (notif && notif.userId === session.user.id) {
    await prisma.notification.delete({ where: { id: params.id } })
  }

  return NextResponse.json({ ok: true })
}
