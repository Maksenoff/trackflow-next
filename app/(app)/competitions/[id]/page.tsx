import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, isCompetitionManager, type Role } from '@/lib/roles'
import { getCompetitionDetail, getAthletesForRegistration } from '@/lib/competitions-data'
import { daysUntil } from '@/lib/date'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { CompetitionHeader } from '@/components/competitions/competition-header'
import { CompetitionTabs } from '@/components/competitions/competition-tabs'

export default async function CompetitionDetailPage({ params }: { params: { id: string } }) {
  const [competition, registrationAthletes] = await Promise.all([
    getCompetitionDetail(params.id),
    getAthletesForRegistration(params.id),
  ])
  if (!competition) notFound()

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles) || isCompetitionManager(roles)

  let linkedAthleteId: string | null = null
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }

  const isPast = daysUntil(competition.date) < 0

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour au calendrier" />

        <CompetitionHeader competition={competition} isPast={isPast} canManage={canManage} />

        <CompetitionTabs
          competition={competition}
          canManage={canManage}
          linkedAthleteId={linkedAthleteId}
          registrationAthletes={registrationAthletes}
        />
      </div>
    </PageTransition>
  )
}
