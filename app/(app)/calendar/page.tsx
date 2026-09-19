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
  getMonthBirthdays,
} from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { CalendarView } from '@/components/calendar/calendar-view'
import { getClubHourlyWeather } from '@/lib/weather'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: {
    year?: string
    month?: string
    showAllCustom?: string
    view?: string
    week?: string
  }
}) {
  const now = new Date()
  const year = Number(searchParams.year) || now.getFullYear()
  const month = Number(searchParams.month) || now.getMonth() + 1

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]

  // Vue mémorisée par profil (User.calendarView) : "?view=" dans l'URL prime
  // toujours (lien "Gérer", partage d'URL...), sinon on retombe sur la
  // préférence enregistrée, et seulement à défaut sur "semaine" par défaut
  // (retour Maksen du 2026-09-13, avant l'ajout de cette mémorisation).
  let savedView: 'month' | 'week' | null = null
  if (session && !searchParams.view) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { calendarView: true },
    })
    savedView =
      user?.calendarView === 'month' ? 'month' : user?.calendarView === 'week' ? 'week' : null
  }
  const initialView =
    searchParams.view === 'month'
      ? 'month'
      : searchParams.view === 'week'
        ? 'week'
        : (savedView ?? 'week')
  // Ancre de la semaine affichée en vue "semaine" — le mois/année ci-dessus
  // servent uniquement à charger les données (avec la marge de `monthRange`,
  // cf. lib/calendar-data.ts), la vraie semaine visible est pilotée par cette
  // date précise pour ne pas dépendre du 1er du mois.
  const initialWeekAnchor = searchParams.week || null
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

  const [
    sessions,
    competitions,
    customSessions,
    trainingTypes,
    competitionTypes,
    coaches,
    weather,
    birthdays,
  ] = await Promise.all([
    getMonthSessions(year, month),
    getMonthCompetitions(year, month, linkedAthleteId),
    getMonthCustomSessions(year, month, linkedAthleteId, showAllCustom),
    getTrainingTypes(),
    getCompetitionTypes(),
    getCoachUsers(),
    // Utilisée à la fois par le carrousel semaine mobile et par la
    // pastille météo discrète des cellules de la grille (mois + semaine
    // desktop, cf. calendar-view.tsx) — on la charge dans les deux vues.
    getClubHourlyWeather(),
    getMonthBirthdays(year, month),
  ])

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        {/* Masqué sur mobile : redondant avec la nav (déjà sur "Calendrier") et
            prend de la hauteur pour rien sur un écran déjà serré (retour
            Maksen 2026-09-18, objectif zéro scroll ici). Un enfant en
            `display:none` (via `hidden`) ne génère aucune boîte, donc aucun
            écart résiduel côté `space-y-*` du parent — pas besoin de retirer
            ce bloc de son flux. */}
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-foreground">Entraînements et compétitions du club.</p>
        </div>

        <CalendarView
          year={year}
          month={month}
          initialView={initialView}
          initialWeekAnchor={initialWeekAnchor}
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
          weather={weather}
          birthdays={birthdays.map((b) => ({
            athleteId: b.athleteId,
            firstName: b.firstName,
            lastName: b.lastName,
            date: b.date,
          }))}
        />
      </div>
    </PageTransition>
  )
}
