import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getTeamsList } from '@/lib/teams-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamsView } from '@/components/teams/teams-view'

export default async function TeamsPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  // Un athlète (compte lié à un profil) peut créer sa propre équipe, pas
  // seulement le staff — même logique de "création libre-service" que les
  // athlètes pour leur propre profil (voir POST /api/athletes).
  let hasLinkedAthlete = false
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { linkedAthleteId: true },
    })
    hasLinkedAthlete = !!user?.linkedAthleteId
  }
  const canCreate = canManage || hasLinkedAthlete

  const teams = await getTeamsList()

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10">
        <TeamsView teams={teams} canCreate={canCreate} />
      </div>
    </PageTransition>
  )
}
