// Port fidèle de NotificationService (repo Symfony, src/Service/NotificationService.php)
// + le flux "séance à débriefer" calculé à la volée depuis NotificationController::buildPayload,
// aligné sur notre propre règle métier de debrief (lib/session-debrief.ts).

import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import { computeDebriefStatus } from '@/lib/session-debrief'
import { naiveToRealInstant, realInstantToNaive } from '@/lib/date'

export const NOTIFICATION_TYPES = {
  FEEDBACK: 'feedback',
  DEBRIEF: 'debrief',
  SESSION_SOON: 'session-soon',
  SESSION_MOVED: 'session-moved',
  COMPETITION: 'competition',
  FFA: 'ffa',
  ACCOUNT: 'account',
} as const

const SESSION_SOON_WINDOW_MS = 2 * 60 * 60 * 1000 // 2h avant le début de la séance

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

// Pas d'envoi d'email (aucune infra mail dans ce rewrite) : la demande "mot de passe
// oublié" notifie simplement les admins, qui réinitialisent manuellement via
// /admin/users/[id] (fonctionnalité déjà existante).
export async function notifyPasswordResetRequested(
  adminUserId: string,
  requesterName: string,
  requesterEmail: string
): Promise<void> {
  const title = 'Mot de passe oublié'
  const body = `${requesterName} (${requesterEmail}) demande une réinitialisation.`
  await prisma.notification.create({
    data: {
      userId: adminUserId,
      type: NOTIFICATION_TYPES.ACCOUNT,
      title,
      body,
      url: '/admin/users',
    },
  })
  await sendPushToUser(adminUserId, {
    title,
    body,
    url: '/admin/users',
    tag: `account-${Date.now()}`,
  })
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

/**
 * Destinataires des notifications liées aux séances : tout athlète lié à un
 * compte (les séances ne sont pas assignées à des athlètes précis, elles
 * concernent tout le club) + tout coach, même sans profil athlète lié (sinon
 * un compte coach pur ne reçoit jamais aucun rappel de séance).
 */
async function getSessionNotificationRecipients(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { disabled: false },
    select: { id: true, roles: true, linkedAthleteId: true },
  })
  return users
    .filter(
      (u) => u.linkedAthleteId !== null || (JSON.parse(u.roles) as string[]).includes('ROLE_COACH')
    )
    .map((u) => u.id)
}

/**
 * Rappel "séance bientôt" — appelé par le sweep cron (lib/notifications.ts::
 * runSessionReminders, cf. app/api/cron/session-reminders/route.ts), pas au
 * moment de la création : la séance doit être passée sous ~2h avant le début.
 */
async function notifySessionSoon(
  userId: string,
  sessionTitle: string,
  sessionUrl: string
): Promise<void> {
  await notify(userId, NOTIFICATION_TYPES.SESSION_SOON, 'Séance bientôt', sessionTitle, sessionUrl)
}

export async function notifySessionMoved(sessionTitle: string, sessionUrl: string): Promise<void> {
  const recipients = await getSessionNotificationRecipients()
  await Promise.all(
    recipients.map((userId) =>
      notify(userId, NOTIFICATION_TYPES.SESSION_MOVED, 'Séance déplacée', sessionTitle, sessionUrl)
    )
  )
}

/**
 * Sweep cron (toutes les ~15 min, voir app/api/cron/session-reminders/route.ts
 * + .github/workflows/session-reminders.yml) : notifie pour toute séance dont
 * le début tombe dans la fenêtre 1h40-2h10 à partir de maintenant. Fenêtre
 * large (30 min) par rapport à la cadence du cron (15 min) pour absorber le
 * retard éventuel d'un tick sans jamais rater une séance ; le dédoublonnage de
 * `notify()` (pas de doublon non-lu même type+url+user) évite qu'un même
 * rappel parte deux fois si deux ticks la voient toutes les deux dans la
 * fenêtre.
 */
export async function runSessionReminders(): Promise<{ notified: number }> {
  // `startTime` en base est une heure murale naïve (chiffres UTC littéraux =
  // heure de Paris saisie) — il faut comparer dans ce même espace naïf, donc
  // convertir `now` (instant réel) plutôt que comparer un instant réel à un
  // champ naïf directement (c'était le bug : rappel/décompte décalés de
  // l'écart Paris/UTC, 2h en été).
  const nowNaive = realInstantToNaive(new Date()).getTime()
  const windowStart = new Date(nowNaive + 100 * 60 * 1000)
  const windowEnd = new Date(nowNaive + 130 * 60 * 1000)

  const [sessions, recipients] = await Promise.all([
    prisma.session.findMany({
      where: { startTime: { gte: windowStart, lte: windowEnd } },
      select: { id: true, title: true },
    }),
    getSessionNotificationRecipients(),
  ])

  let notified = 0
  for (const session of sessions) {
    const url = `/sessions/${session.id}`
    for (const userId of recipients) {
      await notifySessionSoon(userId, session.title, url)
      notified++
    }
  }
  return { notified }
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

/** Formatte un délai avant un évènement futur (ex: rappel "séance dans 45 min").
 * `date` est une heure murale naïve (cf. runSessionReminders) : on la convertit
 * en instant réel avant de la comparer à `Date.now()`. */
function timeUntil(date: Date): string {
  const diffMin = Math.max(
    0,
    Math.round((naiveToRealInstant(date).getTime() - Date.now()) / 60_000)
  )
  if (diffMin < 1) return 'maintenant'
  if (diffMin < 60) return `dans ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  const remMin = diffMin % 60
  return remMin > 0 ? `dans ${diffH}h${String(remMin).padStart(2, '0')}` : `dans ${diffH}h`
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
  const sessionSoonItems: NotificationFeedItem[] = []
  if (user?.linkedAthleteId) {
    const now = new Date()
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - 14)
    // `startTime` est une heure murale naïve — la fenêtre "bientôt" doit être
    // comparée dans ce même espace naïf, pas en instant réel direct (même bug
    // que runSessionReminders : décompte décalé de l'écart Paris/UTC).
    const nowNaive = realInstantToNaive(now)
    const soonEndNaive = new Date(nowNaive.getTime() + SESSION_SOON_WINDOW_MS)

    const [pastSessions, soonSessions, dismissed] = await Promise.all([
      prisma.session.findMany({
        where: { date: { gte: windowStart, lte: now } },
        include: { athleteSessions: { where: { athleteId: user.linkedAthleteId } } },
      }),
      prisma.session.findMany({
        where: { startTime: { gte: nowNaive, lte: soonEndNaive } },
      }),
      prisma.dismissedReminder.findMany({ where: { userId }, select: { key: true } }),
    ])
    const dismissedKeys = new Set(dismissed.map((d) => d.key))

    for (const session of pastSessions) {
      const key = `debrief-${session.id}`
      if (dismissedKeys.has(key)) continue
      const log = session.athleteSessions[0] ?? null
      const status = computeDebriefStatus(
        session.date,
        log,
        session.startTime,
        session.durationMinutes
      )
      if (status !== 'to_debrief') continue
      debriefItems.push({
        id: key,
        type: NOTIFICATION_TYPES.DEBRIEF,
        title: 'Séance à débriefer',
        body: session.title,
        url: `/sessions/${session.id}`,
        isRead: false,
        timeAgo: timeAgo(session.date),
      })
    }

    for (const session of soonSessions) {
      const key = `session-soon-${session.id}`
      if (dismissedKeys.has(key) || !session.startTime) continue
      sessionSoonItems.push({
        id: key,
        type: NOTIFICATION_TYPES.SESSION_SOON,
        title: 'Séance bientôt',
        body: session.title,
        url: `/sessions/${session.id}`,
        isRead: false,
        timeAgo: timeUntil(session.startTime),
      })
    }
  }

  const items: NotificationFeedItem[] = [
    ...sessionSoonItems,
    ...debriefItems,
    ...stored.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      // Le feedback n'a pas de vraie page de destination — l'URL stockée sert
      // uniquement de clé de dédoublonnage côté serveur, jamais exposée comme lien.
      url: n.type === NOTIFICATION_TYPES.FEEDBACK ? null : n.url,
      isRead: n.isRead,
      timeAgo: timeAgo(n.createdAt),
    })),
  ]

  const unread = items.filter((i) => !i.isRead).length
  return { items, unread }
}
