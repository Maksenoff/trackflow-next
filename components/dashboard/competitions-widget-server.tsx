import { getCompetitionsWidgetData } from '@/lib/dashboard'
import { CompetitionWidget } from '@/components/dashboard/competition-widget'

export async function CompetitionsWidgetServer({
  userId,
  canCreate,
}: {
  userId: string
  canCreate: boolean
}) {
  const { nextCompetition, upcomingCompetitions, hasLinkedAthlete } =
    await getCompetitionsWidgetData(userId)
  return (
    <CompetitionWidget
      nextCompetition={nextCompetition}
      upcomingCompetitions={upcomingCompetitions}
      showLinkedBadge={hasLinkedAthlete}
      canCreate={canCreate}
    />
  )
}
