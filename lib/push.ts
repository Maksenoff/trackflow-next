// Envoi WebPush — isolé ici, cf. NotificationService::sendPush (repo Symfony)

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

let configured = false

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:trackflowsupport@gmail.com',
      publicKey,
      privateKey
    )
    configured = true
  }
  return true
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string | null; tag: string }
): Promise<void> {
  if (!ensureConfigured()) return

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subscriptions.length === 0) return

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    tag: payload.tag,
  })

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.publicKey, auth: sub.authToken },
          },
          json
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}
