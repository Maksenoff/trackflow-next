import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getTeamsList } from '@/lib/teams-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamsView } from '@/components/teams/teams-view'

export default async function TeamsPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const teams = await getTeamsList()

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10">
        <TeamsView teams={teams} canManage={canManage} />
      </div>
    </PageTransition>
  )
}
