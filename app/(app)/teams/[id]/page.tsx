import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getTeamDetail } from '@/lib/teams-data'
import { getClubSettings } from '@/lib/club-settings'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { TeamDetailView } from '@/components/teams/team-detail-view'

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const [team, session, clubSettings] = await Promise.all([
    getTeamDetail(params.id),
    auth(),
    getClubSettings(),
  ])
  if (!team) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  let linkedAthleteId: string | null = null
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { linkedAthleteId: true },
    })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }
  const isTeamMember =
    !canManage && !!linkedAthleteId && team.members.some((m) => m.id === linkedAthleteId)

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour aux équipes" href="/teams" />
        <TeamDetailView
          team={team}
          canManage={canManage}
          isTeamMember={isTeamMember}
          clubCode={clubSettings.clubCode}
        />
      </div>
    </PageTransition>
  )
}
