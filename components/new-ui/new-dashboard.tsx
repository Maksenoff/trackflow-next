import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { daysUntil, naiveToRealInstant } from '@/lib/date'
import type {
  SessionWidgetItem,
  CompetitionWidgetItem,
  PerformanceWidgetItem,
} from '@/lib/dashboard'
import type { getPollsList } from '@/lib/polls-data'
import { Reveal } from '@/components/new-ui/reveal'
import { NewHero, NewSideCard, type HeroData } from '@/components/new-ui/new-hero'
import { NewVoteWidget } from '@/components/new-ui/new-vote-widget'
import { NewPerformancesSection } from '@/components/new-ui/new-performance-toggle'
import { CountUp } from '@/components/new-ui/count-up'

type Poll = Awaited<ReturnType<typeof getPollsList>>[number]

function resolveHero(
  session: SessionWidgetItem | null,
  competition: CompetitionWidgetItem | null
): { hero: HeroData; sideCompetition: CompetitionWidgetItem | null } {
  if (session) {
    if (session.startTime && session.durationMinutes) {
      const start = naiveToRealInstant(session.startTime)
      const end = new Date(start.getTime() + session.durationMinutes * 60_000)
      const now = new Date()
      if (now >= start && now <= end) {
        const progressPct = Math.min(
          100,
          Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)
        )
        const minutesLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60_000))
        return {
          hero: { kind: 'session-progress', session, progressPct, minutesLeft },
          sideCompetition: competition,
        }
      }
    }
    return { hero: { kind: 'session-next', session }, sideCompetition: competition }
  }
  if (competition) {
    return {
      hero: {
        kind: 'competition',
        competition,
        daysLeft: Math.max(0, daysUntil(competition.date)),
      },
      sideCompetition: null,
    }
  }
  return { hero: { kind: 'empty' }, sideCompetition: null }
}

export function NewDashboard({
  firstName,
  today,
  view,
  totalAthletes,
  canCreateAthlete,
  sessions,
  competitions,
  performances,
  poll,
}: {
  firstName: string | null
  today: string
  view: 'athlete' | 'coach'
  totalAthletes: number | null
  canCreateAthlete: boolean
  sessions: { nextSession: SessionWidgetItem | null; upcomingSessions: SessionWidgetItem[] }
  competitions: {
    nextCompetition: CompetitionWidgetItem | null
    upcomingCompetitions: CompetitionWidgetItem[]
  }
  performances:
    | { view: 'athlete'; hasLinkedAthlete: boolean; recentPerformances: PerformanceWidgetItem[] }
    | {
        view: 'coach'
        hasLinkedAthlete: boolean
        allPerformances: PerformanceWidgetItem[]
        myPerformances: PerformanceWidgetItem[]
      }
  poll: Poll | null
}) {
  const { hero, sideCompetition } = resolveHero(sessions.nextSession, competitions.nextCompetition)

  return (
    <div>
      <Reveal index={0} className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="nu-it text-[40px]" style={{ color: 'var(--nu-txt)' }}>
            {firstName ? `Bonjour, ${firstName}` : 'Bienvenue'}
          </h1>
          <div
            className="mt-3 flex flex-wrap items-center gap-3 text-sm"
            style={{ color: 'var(--nu-dim)' }}
          >
            <span className="capitalize">{today}</span>
            {view === 'coach' && totalAthletes !== null && (
              <span>
                <CountUp value={totalAthletes} className="nu-num" /> athlète
                {totalAthletes > 1 ? 's' : ''} suivi
                {totalAthletes > 1 ? 's' : ''}
              </span>
            )}
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
              style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
            >
              {view === 'coach' ? 'Coach' : 'Athlète'}
            </span>
          </div>
        </div>
        {canCreateAthlete && (
          <Link
            href="/athletes/new"
            className="nu-sheen inline-flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
          >
            <UserPlus className="size-4" />
            Nouvel athlète
          </Link>
        )}
      </Reveal>

      <div
        className={`grid gap-[18px] ${sideCompetition ? 'lg:grid-cols-[2.15fr_1fr]' : 'lg:grid-cols-1'}`}
      >
        <Reveal index={1}>
          <NewHero data={hero} />
        </Reveal>
        {sideCompetition && (
          <Reveal index={2}>
            <NewSideCard
              competition={sideCompetition}
              daysLeft={Math.max(0, daysUntil(sideCompetition.date))}
            />
          </Reveal>
        )}
      </div>

      <div className="mt-[52px] grid gap-[46px] lg:grid-cols-[0.97fr_1.1fr] lg:items-stretch">
        <Reveal index={3} className="flex flex-1 flex-col">
          <div
            className="flex min-h-[46px] items-center justify-between gap-3 border-b pb-3.5"
            style={{ borderColor: 'var(--nu-line)' }}
          >
            <span
              className="text-[10.5px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: 'var(--nu-dim)' }}
            >
              Vote en cours
            </span>
          </div>
          <NewVoteWidget poll={poll} />
        </Reveal>

        <Reveal index={4} className="flex flex-1 flex-col">
          <NewPerformancesSection performances={performances} />
        </Reveal>
      </div>
    </div>
  )
}
