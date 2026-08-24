import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamForm } from '@/components/teams/team-form'

export default async function NewTeamPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  if (!isAdmin(roles) && !isCoach(roles)) redirect('/teams')

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
