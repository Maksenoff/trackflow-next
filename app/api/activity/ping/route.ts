import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Seuil sous lequel on ne réécrit pas lastActiveAt — le client ping déjà au
// plus une fois par minute (voir components/activity-ping.tsx), ce garde-fou
// serveur évite en plus toute écriture en rafale si plusieurs onglets pingent.
const MIN_INTERVAL_MS = 60_000

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastActiveAt: true },
  })
  const now = new Date()
  if (user?.lastActiveAt && now.getTime() - user.lastActiveAt.getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { lastActiveAt: now } })
  return NextResponse.json({ ok: true })
}
