import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, resolveNewUi, type Role } from '@/lib/roles'
import { getTeamDetail } from '@/lib/teams-data'
import { getClubSettings } from '@/lib/club-settings'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { TeamDetailView } from '@/components/teams/team-detail-view'
import { NewTeamDetail } from '@/components/new-ui/new-team-detail'
import { NewBackButton } from '@/components/new-ui/new-back-button'

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const [team, session, clubSettings] = await Promise.all([
    getTeamDetail(params.id),
    auth(),
    getClubSettings(),
  ])
  if (!team) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  // Une seule requête pour les deux champs (avant : deux `findUnique` distincts
  // sur le même `session.user.id` — retour Maksen, minimiser les chargements).
  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { linkedAthleteId: true, newUiEnabled: true },
      })
    : null
  const linkedAthleteId = currentUser?.linkedAthleteId ?? null
  const isTeamMember =
    !canManage && !!linkedAthleteId && team.members.some((m) => m.id === linkedAthleteId)

  // Suppression : staff toujours, ou l'auteur de la création (lui seul, pas
  // les autres membres même s'ils peuvent éditer le relais).
  const canDelete = canManage || (!!session && team.createdByUserId === session.user.id)

  const newUiEnabled = resolveNewUi(currentUser?.newUiEnabled, roles)

  if (newUiEnabled) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1600px] p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewBackButton label="Retour aux équipes" />
          <NewTeamDetail
            team={team}
            canManage={canManage}
            isTeamMember={isTeamMember}
            canDelete={canDelete}
            clubCode={clubSettings.clubCode}
          />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour aux équipes" href="/teams" />
        <TeamDetailView
          team={team}
          canManage={canManage}
          isTeamMember={isTeamMember}
          canDelete={canDelete}
          clubCode={clubSettings.clubCode}
        />
      </div>
    </PageTransition>
  )
}
