import { Suspense } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, resolveNewUi, type Role } from '@/lib/roles'
import {
  getDashboardMeta,
  getSessionsWidgetData,
  getCompetitionsWidgetData,
  getPerformancesWidgetData,
} from '@/lib/dashboard'
import { getPollsList } from '@/lib/polls-data'
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
import { NewDashboard } from '@/components/new-ui/new-dashboard'

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

  const rawNewUiEnabled = (
    await prisma.user.findUnique({ where: { id: userId }, select: { newUiEnabled: true } })
  )?.newUiEnabled
  const newUiEnabled = resolveNewUi(rawNewUiEnabled, roles)

  if (newUiEnabled) {
    if (meta.view === 'athlete' && !meta.hasLinkedAthlete) {
      return (
        <PageTransition>
          <div className="space-y-6 p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
            <div
              className="flex flex-col items-center gap-4 rounded-[24px] p-8 text-center"
              style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
            >
              <span
                className="flex size-12 items-center justify-center rounded-2xl text-white"
                style={{ background: 'var(--nu-acc)' }}
              >
                <UserPlus className="size-6" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--nu-txt)' }}>
                  Aucun profil athlète lié
                </h2>
                <p className="max-w-sm text-sm" style={{ color: 'var(--nu-dim)' }}>
                  Crée ton profil pour accéder à tes séances, tes compétitions et suivre tes
                  performances — ou demande à ton coach de le lier depuis l&apos;admin.
                </p>
              </div>
              <Link
                href="/athletes/new"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: 'var(--nu-acc)' }}
              >
                <UserPlus className="size-4" />
                Créer mon profil athlète
              </Link>
            </div>
          </div>
        </PageTransition>
      )
    }

    const [sessionsData, competitionsData, performancesData, polls] = await Promise.all([
      getSessionsWidgetData(),
      getCompetitionsWidgetData(userId),
      getPerformancesWidgetData(userId, roles),
      getPollsList(userId),
    ])
    // Épinglés puis plus récents en premier (ordre déjà appliqué par
    // getPollsList) : le premier duel actif de cette liste est donc le plus
    // pertinent à mettre en avant sur le dashboard.
    const activePoll = polls.find((p) => p.status === 'active') ?? null

    return (
      <PageTransition>
        <div className="p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewDashboard
            firstName={firstName}
            today={today}
            view={meta.view}
            totalAthletes={meta.totalAthletes}
            canCreateAthlete={canCreateAthlete}
            sessions={sessionsData}
            competitions={competitionsData}
            performances={performancesData}
            poll={activePoll}
          />
        </div>
      </PageTransition>
    )
  }

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
