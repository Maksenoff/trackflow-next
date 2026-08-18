import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getTeamDetail } from '@/lib/teams-data'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamDetailView } from '@/components/teams/team-detail-view'

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const team = await getTeamDetail(params.id)
  if (!team) notFound()

  const allAthletes = canManage ? await getAthletesList() : []

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10">
        <TeamDetailView
          team={team}
          allAthletes={allAthletes.map((a) => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            photoUrl: a.photoUrl,
            photoConfig: a.photoConfig,
          }))}
          canManage={canManage}
        />
      </div>
    </PageTransition>
  )
}
