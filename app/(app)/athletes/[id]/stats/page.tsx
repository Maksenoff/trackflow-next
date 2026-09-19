import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAthleteDetail } from '@/lib/athletes-data'
import { fullName } from '@/lib/athlete'
import { resolveNewUi, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { NewBackButton } from '@/components/new-ui/new-back-button'
import { StatsAdvancedView } from '@/components/athletes/stats/stats-advanced-view'
import type { RawPerf } from '@/lib/athlete-stats'

export default async function AthleteStatsPage({ params }: { params: { id: string } }) {
  const [athlete, session] = await Promise.all([getAthleteDetail(params.id), auth()])
  if (!athlete) notFound()
  if (athlete.performances.length === 0) redirect(`/athletes/${athlete.id}`)
  // Stats avancées : reste la vue classique telle quelle (graphes/KPIs déjà
  // fonctionnels) — seule la palette change en nouvelle interface, via les
  // tokens --primary/--card/... déjà remappés sur --nu-* par app/globals.css
  // (portés automatiquement par le wrapper .new-ui du layout, aucune
  // modification de StatsAdvancedView nécessaire). Seul le chrome de page
  // (retour, titre) est réaligné visuellement ici.
  const roles = (session?.user.roles ?? []) as Role[]
  const rawNewUiEnabled = session?.user.id
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { newUiEnabled: true },
        })
      )?.newUiEnabled
    : false
  const newUiEnabled = resolveNewUi(rawNewUiEnabled, roles)

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
  const label = fullName(athlete.firstName, athlete.lastName)

  if (newUiEnabled) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1600px] p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewBackButton label={`Retour à ${label}`} />
          <div className="mb-6">
            <h1
              className="text-[clamp(26px,2.9vw,36px)] leading-[1.04] font-extrabold tracking-[-0.02em]"
              style={{ color: 'var(--nu-txt)' }}
            >
              Stats avancées
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: 'var(--nu-dim)' }}>
              {label}
            </p>
          </div>
          <StatsAdvancedView perfs={perfs} disciplines={disciplines} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label={`Retour à ${label}`} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Stats avancées</h1>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <StatsAdvancedView perfs={perfs} disciplines={disciplines} />
      </div>
    </PageTransition>
  )
}
