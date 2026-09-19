import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, primaryRole, resolveNewUi, ROLE_LABELS, type Role } from '@/lib/roles'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { AthletesGrid } from '@/components/athletes/athletes-grid'
import { NewAthletesPage } from '@/components/new-ui/new-athletes-page'

export default async function AthletesPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const rawNewUiEnabled = session?.user.id
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { newUiEnabled: true },
        })
      )?.newUiEnabled
    : false
  const newUiEnabled = resolveNewUi(rawNewUiEnabled, roles)

  if (newUiEnabled) {
    // Recherche instantanée côté client (façon mockup), pas de query string à
    // synchroniser ici : on charge tout le roster une fois.
    const athletes = await getAthletesList()
    const role = primaryRole(roles)
    return (
      <PageTransition>
        <div className="p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewAthletesPage
            athletes={athletes}
            canManage={canManage}
            roleLabel={role ? ROLE_LABELS[role] : null}
          />
        </div>
      </PageTransition>
    )
  }

  const athletes = await getAthletesList(searchParams.q)

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <AthletesGrid athletes={athletes} canManage={canManage} query={searchParams.q ?? ''} />
      </div>
    </PageTransition>
  )
}
