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
  // Onglet Apparence ouvert à tout le monde (décision Maksen 2026-09-19, fin
  // de la bêta) : tous les comptes peuvent au moins changer leur couleur
  // d'accent ; seul le sous-réglage "Ancienne interface" à l'intérieur du
  // panneau reste admin-only (voir isAdmin passé à AppearancePanel plus bas
  // et app/api/users/me/appearance/route.ts).
  const canManageAppearance = true
  if (
    !canManageSessions &&
    !canManageCompetitions &&
    !canManageConfiguration &&
    !canManageAppearance
  )
    redirect('/dashboard')

  function resolveInitialTab(): 'sessions' | 'competitions' | 'configuration' | 'appearance' {
    if (searchParams.tab === 'appearance' && canManageAppearance) return 'appearance'
    if (searchParams.tab === 'configuration' && canManageConfiguration) return 'configuration'
    if (searchParams.tab === 'competitions' && canManageCompetitions) return 'competitions'
    if (canManageSessions) return 'sessions'
    if (canManageCompetitions) return 'competitions'
    if (canManageConfiguration) return 'configuration'
    return 'appearance'
  }

  const [trainingTypes, competitionTypes, clubSettings, currentUser] = await Promise.all([
    prisma.trainingType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    }),
    prisma.competitionType.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { competitions: true } } },
    }),
    canManageConfiguration ? getClubSettings() : Promise.resolve({ clubCode: null }),
    session
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { newUiEnabled: true, accentColor: true },
        })
      : Promise.resolve(null),
  ])

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8 xl:p-10">
        {/* Masqué sur mobile : redondant avec la nav (déjà sur "Paramètres"),
            même traitement que /calendar (retour Maksen 2026-09-18). */}
        <div className="hidden text-center sm:block">
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
          showAppearance={canManageAppearance}
          isAdmin={isAdmin(roles)}
          initialClubCode={clubSettings.clubCode}
          initialNewUiEnabled={currentUser?.newUiEnabled ?? false}
          initialAccentColor={currentUser?.accentColor ?? null}
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
