import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { ROLE_LABELS, isAdmin, type Role } from '@/lib/roles'
import { getDashboardData } from '@/lib/dashboard'
import { PageTransition } from '@/components/motion/page-transition'
import { Badge } from '@/components/ui/badge'
import { SessionWidget } from '@/components/dashboard/session-widget'
import { CompetitionWidget } from '@/components/dashboard/competition-widget'
import { PerformanceList } from '@/components/dashboard/performance-list'
import { PerformancePanel } from '@/components/dashboard/performance-panel'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user.name?.split(' ')[0] ?? ''
  const roles = (session?.user.roles ?? []) as Role[]
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const data = await getDashboardData(session!.user.id, roles)

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {data.view === 'coach' && (
                <>
                  {data.totalAthletes} athlète{data.totalAthletes > 1 ? 's' : ''} suivi
                  {data.totalAthletes > 1 ? 's' : ''} ·{' '}
                </>
              )}
              {today}
            </p>
            <div className="flex gap-1.5 pt-1">
              {roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))}
            </div>
          </div>

          {isAdmin(roles) && (
            <Link
              href="/athletes/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" />
              Nouvel athlète
            </Link>
          )}
        </div>

        {data.view === 'athlete' && !data.hasLinkedAthlete ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-400">
            <strong>Compte non lié.</strong> Ton compte n&apos;est pas encore lié à un profil
            athlète. Contacte ton coach.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
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

            <div>
              {data.view === 'coach' ? (
                <PerformancePanel
                  allPerformances={data.allPerformances}
                  myPerformances={data.myPerformances}
                  hasLinkedAthlete={data.hasLinkedAthlete}
                />
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
