// Port fidèle de NotificationService (repo Symfony, src/Service/NotificationService.php)
// + le flux "séance à débriefer" calculé à la volée depuis NotificationController::buildPayload,
// aligné sur notre propre règle métier de debrief (lib/session-debrief.ts).

import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import { computeDebriefStatus } from '@/lib/session-debrief'

export const NOTIFICATION_TYPES = {
  FEEDBACK: 'feedback',
  DEBRIEF: 'debrief',
  COMPETITION: 'competition',
  FFA: 'ffa',
} as const

/** Notification générique avec dédoublonnage : pas de doublon non-lu du même type sur la même URL. */
async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  url?: string | null
): Promise<void> {
  if (url) {
    const existing = await prisma.notification.findFirst({
      where: { userId, type, url, isRead: false },
    })
    if (existing) return
  }

  await prisma.notification.create({ data: { userId, type, title, body, url: url ?? null } })
  await sendPushToUser(userId, { title, body, url, tag: `${type}-${Date.now()}` })
}

export async function notifyFeedbackUpdated(
  userId: string,
  status: 'in_progress' | 'done',
  feedbackId: string
): Promise<void> {
  const labels: Record<string, [string, string]> = {
    in_progress: ['Feedback en cours de traitement', 'Ta suggestion est prise en compte.'],
    done: ['Feedback traité ✓', 'Ton retour a été corrigé ou implémenté.'],
  }
  const label = labels[status]
  if (!label) return

  // Pas de page "mon feedback" côté utilisateur dans ce rewrite (contrairement au Symfony
  // d'origine) : l'URL sert uniquement de clé de dédoublonnage stable par feedback, le clic
  // ramène simplement au dashboard plutôt que vers une route inexistante.
  const url = `/dashboard?feedback=${feedbackId}`
  await prisma.notification.deleteMany({
    where: { userId, type: NOTIFICATION_TYPES.FEEDBACK, url },
  })

  const [title, body] = label
  await prisma.notification.create({
    data: { userId, type: NOTIFICATION_TYPES.FEEDBACK, title, body, url },
  })
  await sendPushToUser(userId, { title, body, url, tag: `feedback-${Date.now()}` })
}

export async function notifyFfaConfirmed(
  userId: string,
  competitionTitle: string,
  competitionUrl: string
): Promise<void> {
  await notify(
    userId,
    NOTIFICATION_TYPES.FFA,
    'Inscription FFA confirmée',
    `Tu es bien inscrit(e) FFA pour : ${competitionTitle}`,
    competitionUrl
  )
}

export async function notifyAthleteRegistered(
  recipientUserId: string,
  athleteName: string,
  competitionTitle: string,
  competitionUrl: string
): Promise<void> {
  const title = `${athleteName} s'est inscrit(e)`
  await prisma.notification.create({
    data: {
      userId: recipientUserId,
      type: NOTIFICATION_TYPES.COMPETITION,
      title,
      body: competitionTitle,
      url: competitionUrl,
    },
  })
  await sendPushToUser(recipientUserId, {
    title,
    body: competitionTitle,
    url: competitionUrl,
    tag: `competition-${Date.now()}`,
  })
}

export async function notifyCompetitionSoon(
  userId: string,
  competitionTitle: string,
  competitionUrl: string,
  daysLeft: number
): Promise<void> {
  await notify(
    userId,
    NOTIFICATION_TYPES.COMPETITION,
    `Compétition dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
    competitionTitle,
    competitionUrl
  )
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffDays = Math.floor(diffH / 24)
  if (diffDays < 7) return `il y a ${diffDays}j`
  return `il y a ${Math.floor(diffDays / 7)} sem.`
}

export type NotificationFeedItem = {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  isRead: boolean
  timeAgo: string
}

/** Fusionne les notifications stockées avec les rappels "séance à débriefer" calculés à la volée. */
export async function buildNotificationFeed(
  userId: string
): Promise<{ items: NotificationFeedItem[]; unread: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { linkedAthleteId: true },
  })

  const stored = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const debriefItems: NotificationFeedItem[] = []
  if (user?.linkedAthleteId) {
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - 14)

    const sessions = await prisma.session.findMany({
      where: { date: { gte: windowStart, lte: new Date() } },
      include: { athleteSessions: { where: { athleteId: user.linkedAthleteId } } },
    })

    for (const session of sessions) {
      const log = session.athleteSessions[0] ?? null
      const status = computeDebriefStatus(session.date, log)
      if (status !== 'to_debrief') continue
      debriefItems.push({
        id: `debrief-${session.id}`,
        type: NOTIFICATION_TYPES.DEBRIEF,
        title: 'Séance à débriefer',
        body: session.title,
        url: `/sessions/${session.id}`,
        isRead: false,
        timeAgo: timeAgo(session.date),
      })
    }
  }

  const items: NotificationFeedItem[] = [
    ...debriefItems,
    ...stored.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url,
      isRead: n.isRead,
      timeAgo: timeAgo(n.createdAt),
    })),
  ]

  const unread = items.filter((i) => !i.isRead).length
  return { items, unread }
}
