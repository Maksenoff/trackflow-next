import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import {
  getMonthSessions,
  getMonthCompetitions,
  getTrainingTypes,
  getCompetitionTypes,
} from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string }
}) {
  const now = new Date()
  const year = Number(searchParams.year) || now.getFullYear()
  const month = Number(searchParams.month) || now.getMonth() + 1

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManageSessions = isAdmin(roles) || isCoach(roles)
  const canManageCompetitions = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)

  let linkedAthleteId: string | null = null
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }

  const [sessions, competitions, trainingTypes, competitionTypes] = await Promise.all([
    getMonthSessions(year, month),
    getMonthCompetitions(year, month, linkedAthleteId),
    getTrainingTypes(),
    getCompetitionTypes(),
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
          trainingTypes={trainingTypes}
          competitionTypes={competitionTypes}
          canManageSessions={canManageSessions}
          canManageCompetitions={canManageCompetitions}
          isAdmin={isAdmin(roles)}
        />
      </div>
    </PageTransition>
  )
}
