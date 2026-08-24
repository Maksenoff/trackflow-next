import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { AthletesGrid } from '@/components/athletes/athletes-grid'

export default async function AthletesPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const athletes = await getAthletesList(searchParams.q)

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <AthletesGrid athletes={athletes} canManage={canManage} query={searchParams.q ?? ''} />
      </div>
    </PageTransition>
  )
}
