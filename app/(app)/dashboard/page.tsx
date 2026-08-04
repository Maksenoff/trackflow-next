import { TrendingUp } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin, type Role } from '@/lib/roles'
import { getDashboardData } from '@/lib/dashboard'
import { PageTransition } from '@/components/motion/page-transition'
import { RoleBadge } from '@/components/role-badge'
import { AgendaClean } from '@/components/dashboard/agenda-clean'
import { PerformanceCleanList } from '@/components/dashboard/performance-clean-list'
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
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {data.view === 'coach' && (
                <>
                  {data.totalAthletes} athlète{data.totalAthletes > 1 ? 's' : ''} suivi
                  {data.totalAthletes > 1 ? 's' : ''} ·{' '}
                </>
              )}
              {today}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>

        {data.view === 'athlete' && !data.hasLinkedAthlete ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-400">
            <strong>Compte non lié.</strong> Ton compte n&apos;est pas encore lié à un profil
            athlète. Contacte ton coach.
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <AgendaClean
              sessions={data.upcomingSessions}
              competitions={data.upcomingCompetitions}
              showLinkedBadge={data.hasLinkedAthlete}
              canCreate={isAdmin(roles)}
            />

            {data.view === 'coach' ? (
              <PerformancePanel
                allPerformances={data.allPerformances}
                myPerformances={data.myPerformances}
                hasLinkedAthlete={data.hasLinkedAthlete}
                canCreateAthlete={isAdmin(roles)}
              />
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="size-3.5 text-primary" />
                    Mes performances
                  </h2>
                </div>
                <PerformanceCleanList
                  performances={data.recentPerformances}
                  emptyMessage="Aucune performance enregistrée."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
