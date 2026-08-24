import { Suspense } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin, type Role } from '@/lib/roles'
import { getDashboardMeta } from '@/lib/dashboard'
import { PageTransition } from '@/components/motion/page-transition'
import { DashboardWidgets } from '@/components/dashboard/dashboard-widgets'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { NewAthleteFab } from '@/components/dashboard/new-athlete-fab'
import { MotionCta } from '@/components/dashboard/motion-cta'
import { SessionsWidgetServer } from '@/components/dashboard/sessions-widget-server'
import { CompetitionsWidgetServer } from '@/components/dashboard/competitions-widget-server'
import { PerformancesWidgetServer } from '@/components/dashboard/performances-widget-server'
import {
  SessionsSkeleton,
  CompetitionsSkeleton,
  PerformancesSkeleton,
} from '@/components/dashboard/skeletons'

export default async function DashboardPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const userId = session!.user.id
  const firstName = session?.user.name?.split(' ')[0] ?? null
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const meta = await getDashboardMeta(userId, roles)
  const canCreateAthlete = isAdmin(roles)

  return (
    <PageTransition>
      <div className="space-y-6 p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
        <DashboardHeader
          firstName={firstName}
          roles={roles}
          view={meta.view}
          totalAthletes={meta.totalAthletes}
          today={today}
        />

        {meta.view === 'athlete' && !meta.hasLinkedAthlete ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-primary/20 bg-primary/[0.04] p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/25">
              <UserPlus className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Aucun profil athlète lié</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Crée ton profil pour accéder à tes séances, tes compétitions et suivre tes
                performances — ou demande à ton coach de le lier depuis l&apos;admin.
              </p>
            </div>
            <MotionCta>
              <Link
                href="/athletes/new"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover"
              >
                <UserPlus className="size-4" />
                Créer mon profil athlète
              </Link>
            </MotionCta>
          </div>
        ) : (
          <DashboardWidgets
            sessions={
              <Suspense fallback={<SessionsSkeleton />}>
                <SessionsWidgetServer />
              </Suspense>
            }
            competitions={
              <Suspense fallback={<CompetitionsSkeleton />}>
                <CompetitionsWidgetServer userId={userId} canCreate={canCreateAthlete} />
              </Suspense>
            }
            performances={
              <Suspense fallback={<PerformancesSkeleton />}>
                <PerformancesWidgetServer
                  userId={userId}
                  roles={roles}
                  canCreateAthlete={canCreateAthlete}
                />
              </Suspense>
            }
          />
        )}
      </div>

      {canCreateAthlete && <NewAthleteFab />}
    </PageTransition>
  )
}
