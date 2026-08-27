import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamForm } from '@/components/teams/team-form'

export default async function NewTeamPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const isStaff = isAdmin(roles) || isCoach(roles)

  // Un athlète (compte lié à un profil) peut créer sa propre équipe, pas
  // seulement le staff — même logique que la page liste (/teams).
  let hasLinkedAthlete = false
  if (!isStaff && session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { linkedAthleteId: true },
    })
    hasLinkedAthlete = !!user?.linkedAthleteId
  }
  if (!isStaff && !hasLinkedAthlete) redirect('/teams')

  const athletes = await getAthletesList()

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] p-4 lg:p-8 xl:p-10">
        <TeamForm
          mode="create"
          allAthletes={athletes.map((a) => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            photoUrl: a.photoUrl,
            photoConfig: a.photoConfig,
            licenseNumber: a.licenseNumber,
          }))}
        />
      </div>
    </PageTransition>
  )
}
