import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import { getCompetitionTypes } from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { CompetitionForm } from '@/components/competitions/competition-form'

export default async function NewCompetitionPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
  if (!canManage) redirect('/calendar')

  const competitionTypes = await getCompetitionTypes()
  const initialDate = searchParams.date ? new Date(searchParams.date) : undefined

  return (
    <PageTransition>
      <CompetitionForm
        mode="create"
        competitionTypes={competitionTypes}
        initialDate={initialDate}
      />
    </PageTransition>
  )
}
