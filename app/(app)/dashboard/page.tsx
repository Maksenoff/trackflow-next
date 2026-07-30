import { TrendingUp } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin, type Role } from '@/lib/roles'
import { getDashboardData } from '@/lib/dashboard'
import { PageTransition } from '@/components/motion/page-transition'
import { RoleBadge } from '@/components/role-badge'
import { SessionWidget } from '@/components/dashboard/session-widget'
import { CompetitionWidget } from '@/components/dashboard/competition-widget'
import { PerformanceList } from '@/components/dashboard/performance-list'
import { PerformancePanel } from '@/components/dashboard/performance-panel'

export default async function DashboardPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const data = await getDashboardData(session!.user.id, roles)

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.06] p-5 lg:p-6 shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Bienvenue sur{' '}
              <span className="inline-block bg-gradient-to-r from-primary to-cyan-400 bg-clip-text pr-1 text-transparent italic">
                TrackFlow
              </span>
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {roles.map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>

            <p className="text-xs text-muted-foreground capitalize">
              {data.view === 'coach' && (
                <>
                  {data.totalAthletes} athlète{data.totalAthletes > 1 ? 's' : ''} suivi
                  {data.totalAthletes > 1 ? 's' : ''} ·{' '}
                </>
              )}
              {today}
            </p>
          </div>
        </div>

        {data.view === 'athlete' && !data.hasLinkedAthlete ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-400">
            <strong>Compte non lié.</strong> Ton compte n&apos;est pas encore lié à un profil
            athlète. Contacte ton coach.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
              <SessionWidget
                nextSession={data.nextSession}
                upcomingSessions={data.upcomingSessions}
              />
              <CompetitionWidget
                nextCompetition={data.nextCompetition}
                upcomingCompetitions={data.upcomingCompetitions}
                showLinkedBadge={data.hasLinkedAthlete}
                canCreate={isAdmin(roles)}
              />
            </div>

            <div className="lg:col-span-2">
              {data.view === 'coach' ? (
                <PerformancePanel
                  allPerformances={data.allPerformances}
                  myPerformances={data.myPerformances}
                  hasLinkedAthlete={data.hasLinkedAthlete}
                  canCreateAthlete={isAdmin(roles)}
                />
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="size-3.5 text-primary" />
                      Mes performances
                    </h2>
                  </div>
                  <PerformanceList
                    performances={data.recentPerformances}
                    emptyMessage="Aucune performance enregistrée."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
