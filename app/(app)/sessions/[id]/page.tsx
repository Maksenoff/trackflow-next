import { notFound } from 'next/navigation'
import { FileText, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getSessionDetail, getTrainingTypes } from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/ui/back-button'
import { SessionActions } from '@/components/sessions/session-actions'
import { RpePanel } from '@/components/sessions/rpe-panel'
import { RpeLogForm } from '@/components/sessions/rpe-log-form'

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const detail = await getSessionDetail(params.id)
  if (!detail) notFound()

  const authSession = await auth()
  const roles = (authSession?.user.roles ?? []) as Role[]
  const canEdit = isAdmin(roles) || isCoach(roles)

  let linkedAthleteId: string | null = null
  if (authSession) {
    const user = await prisma.user.findUnique({ where: { id: authSession.user.id } })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }

  const trainingTypes = await getTrainingTypes()

  const isPast = detail.date < new Date()
  const myLog = linkedAthleteId
    ? detail.athleteSessions.find((as) => as.athleteId === linkedAthleteId)
    : undefined
  const color = detail.trainingType?.color ?? '#6366f1'

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour au calendrier" />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1.5" style={{ background: color }} />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  {detail.trainingType && (
                    <Badge
                      className="border"
                      style={{
                        backgroundColor: `${color}22`,
                        color,
                        borderColor: `${color}44`,
                      }}
                    >
                      {detail.trainingType.name}
                    </Badge>
                  )}
                  <Badge variant={isPast ? 'secondary' : 'default'}>
                    {isPast ? 'Passée' : 'À venir'}
                  </Badge>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {detail.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 capitalize">
                    <CalendarIcon className="size-3.5" />
                    {detail.date.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {detail.startTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {detail.startTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {detail.durationMinutes && <span>{detail.durationMinutes} min</span>}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {canEdit && (
                  <SessionActions
                    sessionId={detail.id}
                    trainingTypes={trainingTypes}
                    initialData={{
                      title: detail.title,
                      date: detail.date,
                      startTime: detail.startTime,
                      durationMinutes: detail.durationMinutes,
                      trainingTypeId: detail.trainingTypeId,
                      description: detail.description,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Programme */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <FileText className="size-3.5 text-muted-foreground" />
            <h2 className="text-sm font-bold">Programme de la séance</h2>
          </div>
          <div className="p-5">
            {detail.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {detail.description}
              </p>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun programme renseigné.
              </p>
            )}
          </div>
        </div>

        {/* Ressentis athlètes */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Ressentis athlètes
            <span className="font-normal normal-case">({detail.athleteSessions.length})</span>
          </h2>
          <RpePanel athleteSessions={detail.athleteSessions} />
        </div>

        {/* Formulaire de ressenti pour l'athlète connecté */}
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
      </div>
    </PageTransition>
  )
}
