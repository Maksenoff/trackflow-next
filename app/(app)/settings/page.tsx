import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import { getClubSettings } from '@/lib/club-settings'
import { PageTransition } from '@/components/motion/page-transition'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManageSessions = isAdmin(roles) || isCoach(roles)
  const canManageCompetitions = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
  const canManageConfiguration = isAdmin(roles)
  if (!canManageSessions && !canManageCompetitions && !canManageConfiguration)
    redirect('/dashboard')

  function resolveInitialTab(): 'sessions' | 'competitions' | 'configuration' {
    if (searchParams.tab === 'configuration' && canManageConfiguration) return 'configuration'
    if (searchParams.tab === 'competitions' && canManageCompetitions) return 'competitions'
    if (canManageSessions) return 'sessions'
    if (canManageCompetitions) return 'competitions'
    return 'configuration'
  }

  const [trainingTypes, competitionTypes, clubSettings] = await Promise.all([
    prisma.trainingType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    }),
    prisma.competitionType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { competitions: true } } },
    }),
    canManageConfiguration ? getClubSettings() : Promise.resolve({ clubCode: null }),
  ])

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8 xl:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Gère les catégories (couleur + nom) utilisées dans les calendriers.
          </p>
        </div>

        <SettingsTabs
          initialTab={resolveInitialTab()}
          showSessions={canManageSessions}
          showCompetitions={canManageCompetitions}
          showConfiguration={canManageConfiguration}
          initialClubCode={clubSettings.clubCode}
          sessionTypes={trainingTypes.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            usageCount: t._count.sessions,
          }))}
          competitionTypes={competitionTypes.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            usageCount: t._count.competitions,
          }))}
        />
      </div>
    </PageTransition>
  )
}
