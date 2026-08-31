import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import {
  getMonthSessions,
  getMonthCompetitions,
  getMonthCustomSessions,
  getTrainingTypes,
  getCompetitionTypes,
  getCoachUsers,
} from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; showAllCustom?: string }
}) {
  const now = new Date()
  const year = Number(searchParams.year) || now.getFullYear()
  const month = Number(searchParams.month) || now.getMonth() + 1

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManageSessions = isAdmin(roles) || isCoach(roles)
  const canManageCompetitions = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
  // Filtre "calendrier général" (voir les séances persos de tous les athlètes) —
  // réservé à qui gère déjà les séances, inutile sinon.
  const showAllCustom = canManageSessions && searchParams.showAllCustom === '1'

  let linkedAthleteId: string | null = null
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }

  const [sessions, competitions, customSessions, trainingTypes, competitionTypes, coaches] =
    await Promise.all([
      getMonthSessions(year, month),
      getMonthCompetitions(year, month, linkedAthleteId),
      getMonthCustomSessions(year, month, linkedAthleteId, showAllCustom),
      getTrainingTypes(),
      getCompetitionTypes(),
      getCoachUsers(),
    ])

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-foreground">Entraînements et compétitions du club.</p>
        </div>

        <CalendarView
          year={year}
          month={month}
          sessions={sessions.map((s) => ({
            id: s.id,
            title: s.title,
            date: s.date,
            startTime: s.startTime,
            durationMinutes: s.durationMinutes,
            description: s.description,
            trainingType: s.trainingType,
            coach: s.coach,
            coachPresent: s.coachPresent,
          }))}
          competitions={competitions.map((c) => ({
            id: c.id,
            title: c.title,
            date: c.date,
            location: c.location,
            competitionTypeId: c.competitionTypeId,
            competitionType: c.competitionType,
            description: c.description,
            registrationCount: c.registrationCount,
            ffaRegisteredCount: c.ffaRegisteredCount,
            isRegistered: c.isRegistered,
          }))}
          customSessions={customSessions.map((cs) => ({
            id: cs.id,
            title: cs.title,
            date: cs.date,
            startTime: cs.startTime,
            durationMinutes: cs.durationMinutes,
            description: cs.description,
            difficulty: cs.difficulty,
            skipped: cs.skipped,
            athlete: cs.athlete,
          }))}
          trainingTypes={trainingTypes}
          competitionTypes={competitionTypes}
          coaches={coaches}
          currentUserId={session?.user.id}
          linkedAthleteId={linkedAthleteId}
          canManageSessions={canManageSessions}
          canManageCompetitions={canManageCompetitions}
          showAllCustom={showAllCustom}
        />
      </div>
    </PageTransition>
  )
}
