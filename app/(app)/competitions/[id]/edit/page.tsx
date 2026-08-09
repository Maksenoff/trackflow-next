import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import { getCompetitionDetail } from '@/lib/competitions-data'
import { getCompetitionTypes } from '@/lib/calendar-data'
import { PageTransition } from '@/components/motion/page-transition'
import { CompetitionForm } from '@/components/competitions/competition-form'

export default async function EditCompetitionPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)
  if (!canManage) redirect(`/competitions/${params.id}`)

  const [competition, competitionTypes] = await Promise.all([
    getCompetitionDetail(params.id),
    getCompetitionTypes(),
  ])
  if (!competition) notFound()

  return (
    <PageTransition>
      <CompetitionForm
        mode="edit"
        competitionId={competition.id}
        competitionTypes={competitionTypes}
        initialData={{
          title: competition.title,
          date: competition.date,
          location: competition.location,
          competitionTypeId: competition.competitionTypeId,
          websiteUrl: competition.websiteUrl,
          documentUrl: competition.documentUrl,
          schedulesUrl: competition.schedulesUrl,
          description: competition.description,
          availableDisciplines: competition.availableDisciplines,
          requestExpectedPerf: competition.requestExpectedPerf,
        }}
      />
    </PageTransition>
  )
}
