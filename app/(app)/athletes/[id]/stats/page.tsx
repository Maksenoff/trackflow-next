import { notFound, redirect } from 'next/navigation'
import { getAthleteDetail } from '@/lib/athletes-data'
import { fullName } from '@/lib/athlete'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { StatsAdvancedView } from '@/components/athletes/stats/stats-advanced-view'
import type { RawPerf } from '@/lib/athlete-stats'

export default async function AthleteStatsPage({ params }: { params: { id: string } }) {
  const athlete = await getAthleteDetail(params.id)
  if (!athlete) notFound()
  if (athlete.performances.length === 0) redirect(`/athletes/${athlete.id}`)

  const perfs: RawPerf[] = athlete.performances.map((p) => ({
    id: p.id,
    discipline: p.discipline,
    value: p.value,
    unit: p.unit,
    recordedAt: p.recordedAt,
    isCompetition: p.isCompetition,
    isIndoor: p.isIndoor,
    wind: p.wind,
  }))

  const disciplines = Array.from(new Set(perfs.map((p) => p.discipline)))

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label={`Retour à ${fullName(athlete.firstName, athlete.lastName)}`} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Stats avancées</h1>
          <p className="text-sm text-muted-foreground">
            {fullName(athlete.firstName, athlete.lastName)}
          </p>
        </div>
        <StatsAdvancedView perfs={perfs} disciplines={disciplines} />
      </div>
    </PageTransition>
  )
}
