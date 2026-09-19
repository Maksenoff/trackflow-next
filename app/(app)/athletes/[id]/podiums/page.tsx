import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, resolveNewUi, type Role } from '@/lib/roles'
import { getAthleteDetail } from '@/lib/athletes-data'
import { fullName } from '@/lib/athlete'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { PodiumsView } from '@/components/athletes/podiums/podiums-view'
import { NewPodiumsPage } from '@/components/new-ui/new-podiums-page'
import { NewBackButton } from '@/components/new-ui/new-back-button'

export default async function AthletePodiumsPage({ params }: { params: { id: string } }) {
  const [athlete, session] = await Promise.all([getAthleteDetail(params.id), auth()])
  if (!athlete) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  // Une seule requête pour les deux champs (avant : deux `findUnique` distincts
  // sur le même `session.user.id` — retour Maksen, minimiser les chargements).
  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { newUiEnabled: true, linkedAthleteId: true },
      })
    : null
  const canEdit = isAdmin(roles) || isCoach(roles) || currentUser?.linkedAthleteId === athlete.id
  const newUiEnabled = resolveNewUi(currentUser?.newUiEnabled, roles)

  const podiums = (
    await prisma.podium.findMany({
      where: { athleteId: params.id },
      orderBy: [{ year: 'desc' }, { rank: 'asc' }],
    })
  ).map((p) => ({
    id: p.id,
    year: p.year,
    rank: p.rank,
    label: p.label,
    level: p.level,
    discipline: p.discipline,
    performance: p.performance,
    recordedAt: p.recordedAt,
    venue: p.venue,
    source: p.source as 'ffa' | 'manual',
  }))
  const athleteInfo = {
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    photoUrl: athlete.photoUrl,
    photoConfig: athlete.photoConfig,
  }

  if (newUiEnabled) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1600px] p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewBackButton label={`Retour à ${fullName(athlete.firstName, athlete.lastName)}`} />
          <NewPodiumsPage
            athleteId={athlete.id}
            canEdit={canEdit}
            podiums={podiums}
            athlete={athleteInfo}
          />
        </div>
      </PageTransition>
    )
  }

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
          athleteId={athlete.id}
          canEdit={canEdit}
          podiums={podiums}
          athlete={athleteInfo}
        />
      </div>
    </PageTransition>
  )
}
