import { notFound } from 'next/navigation'
import { FileText } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getSessionDetail, getTrainingTypes, getCoachUsers } from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { SessionHeader } from '@/components/sessions/session-header'
import { RpeSummaryCard } from '@/components/sessions/rpe-summary-card'
import { RpePanel } from '@/components/sessions/rpe-panel'
import { RpeLogForm } from '@/components/sessions/rpe-log-form'

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const [detail, trainingTypes, coaches, authSession] = await Promise.all([
    getSessionDetail(params.id),
    getTrainingTypes(),
    getCoachUsers(),
    auth(),
  ])
  if (!detail) notFound()

  const roles = (authSession?.user.roles ?? []) as Role[]
  const canEdit = isAdmin(roles) || isCoach(roles)

  let linkedAthleteId: string | null = null
  if (authSession) {
    const user = await prisma.user.findUnique({ where: { id: authSession.user.id } })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }

  const isPast = detail.date < new Date()
  const myLog = linkedAthleteId
    ? detail.athleteSessions.find((as) => as.athleteId === linkedAthleteId)
    : undefined
  // Le ressenti de l'athlète connecté est représenté par le formulaire (ci-dessous),
  // pas dupliqué dans la liste : les autres restent triés par date (loggedAt desc,
  // cf. getSessionDetail).
  const otherAthleteSessions = linkedAthleteId
    ? detail.athleteSessions.filter((as) => as.athleteId !== linkedAthleteId)
    : detail.athleteSessions

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour au calendrier" />

        <SessionHeader
          detail={detail}
          isPast={isPast}
          canEdit={canEdit}
          trainingTypes={trainingTypes}
          coaches={coaches}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <FileText className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Programme de la séance
              </h2>
            </div>
            <div className="min-h-56 flex-1 p-6">
              {detail.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {detail.description}
                </p>
              ) : (
                <p className="pt-6 text-center text-sm text-muted-foreground">
                  Aucun programme renseigné.
                </p>
              )}
            </div>
          </div>

          <RpeSummaryCard athleteSessions={detail.athleteSessions} />
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Ressentis athlètes
            <span className="font-normal normal-case">({detail.athleteSessions.length})</span>
          </h2>

          {linkedAthleteId && isPast && (
            <RpeLogForm
              sessionId={detail.id}
              athleteId={linkedAthleteId}
              initial={
                myLog
                  ? { difficulty: myLog.difficulty, comment: myLog.comment, skipped: myLog.skipped }
                  : undefined
              }
            />
          )}

          <RpePanel athleteSessions={otherAthleteSessions} />
        </div>
      </div>
    </PageTransition>
  )
}
