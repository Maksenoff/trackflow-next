import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, resolveNewUi, type Role } from '@/lib/roles'
import { getTeamsList } from '@/lib/teams-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamsView } from '@/components/teams/teams-view'
import { NewTeamsPage } from '@/components/new-ui/new-teams-page'

export default async function TeamsPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  // `teams` ne dépend pas de la session : lancée en parallèle plutôt qu'après
  // la résolution de l'utilisateur (une seule requête pour linkedAthleteId +
  // newUiEnabled aussi — avant : deux `findUnique` distincts sur le même
  // `session.user.id` — retour Maksen, minimiser les chargements).
  const [teams, currentUser] = await Promise.all([
    getTeamsList(),
    session
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { linkedAthleteId: true, newUiEnabled: true },
        })
      : Promise.resolve(null),
  ])
  // Un athlète (compte lié à un profil) peut créer sa propre équipe, pas
  // seulement le staff — même logique de "création libre-service" que les
  // athlètes pour leur propre profil (voir POST /api/athletes).
  const canCreate = canManage || !!currentUser?.linkedAthleteId
  const newUiEnabled = resolveNewUi(currentUser?.newUiEnabled, roles)

  if (newUiEnabled) {
    return (
      <PageTransition>
        <div className="p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewTeamsPage teams={teams} canCreate={canCreate} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10">
        <TeamsView teams={teams} canCreate={canCreate} />
      </div>
    </PageTransition>
  )
}
