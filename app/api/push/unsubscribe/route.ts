import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pushUnsubscribeSchema } from '@/lib/validations/push'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = pushUnsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const sub = await prisma.pushSubscription.findUnique({
    where: { endpoint: parsed.data.endpoint },
  })
  if (sub && sub.userId === session.user.id) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } })
  }

  return NextResponse.json({ ok: true })
}
