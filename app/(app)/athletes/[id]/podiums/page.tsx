import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAthleteDetail } from '@/lib/athletes-data'
import { fullName } from '@/lib/athlete'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { PodiumsView } from '@/components/athletes/podiums/podiums-view'

export default async function AthletePodiumsPage({ params }: { params: { id: string } }) {
  const athlete = await getAthleteDetail(params.id)
  if (!athlete) notFound()

  const podiums = await prisma.podium.findMany({
    where: { athleteId: params.id },
    orderBy: [{ year: 'desc' }, { rank: 'asc' }],
  })
  if (podiums.length === 0) redirect(`/athletes/${athlete.id}`)

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label={`Retour à ${fullName(athlete.firstName, athlete.lastName)}`} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Podiums</h1>
          <p className="text-sm text-muted-foreground">
            {fullName(athlete.firstName, athlete.lastName)}
          </p>
        </div>
        <PodiumsView
          podiums={podiums.map((p) => ({
            id: p.id,
            year: p.year,
            rank: p.rank,
            label: p.label,
            level: p.level,
            discipline: p.discipline,
            performance: p.performance,
            recordedAt: p.recordedAt,
            venue: p.venue,
          }))}
          athlete={{
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            photoUrl: athlete.photoUrl,
            photoConfig: athlete.photoConfig,
          }}
        />
      </div>
    </PageTransition>
  )
}
