import Link from 'next/link'
import { Plus, TrendingUp } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin, type Role } from '@/lib/roles'
import { getDashboardData } from '@/lib/dashboard'
import { PageTransition } from '@/components/motion/page-transition'
import { RoleBadge } from '@/components/role-badge'
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

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
      <div className="p-4 lg:p-8 xl:p-10 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.06] p-8 lg:p-12 shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-cyan-400/5 blur-3xl"
          />

          {isAdmin(roles) && (
            <Link
              href="/athletes/new"
              className="group absolute top-5 right-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 lg:top-6 lg:right-6 lg:px-5 lg:py-2.5"
            >
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              <span className="hidden sm:inline">Nouvel athlète</span>
            </Link>
          )}

          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {initials(firstName)}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                Bienvenue sur{' '}
                <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent italic">
                  TrackFlow
                </span>
              </h1>
              <p className="text-base font-medium text-muted-foreground">
                {greeting()}, <span className="font-semibold text-foreground">{firstName}</span>{' '}
                <span className="inline-block">👋</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
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
