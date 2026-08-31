import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pushSubscribeSchema } from '@/lib/validations/push'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = pushSubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const { endpoint, keys } = parsed.data

  // Cette route ne touche pas aux clés VAPID (elle ne fait qu'enregistrer
  // l'abonnement du navigateur) — l'échec "clé VAPID introuvable" vient de
  // GET /api/push/vapid-public-key, appelée avant celle-ci côté client
  // (lib/push-client.ts::subscribeToPush). Log minimal pour confirmer que cette
  // étape-ci est bien atteinte lors d'un diagnostic.
  // eslint-disable-next-line no-console
  console.log('POST /api/push/subscribe — abonnement enregistré pour', session.user.id)

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      publicKey: keys.p256dh,
      authToken: keys.auth,
    },
    update: {
      userId: session.user.id,
      publicKey: keys.p256dh,
      authToken: keys.auth,
    },
  })

  return NextResponse.json({ ok: true })
}
