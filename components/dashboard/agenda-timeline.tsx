'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Trophy, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeDayLabel, relativeDayShort, formatShortDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { CompetitionWidgetItem, SessionWidgetItem } from '@/lib/dashboard'

type AgendaEntry =
  | { kind: 'session'; date: Date; session: SessionWidgetItem }
  | { kind: 'competition'; date: Date; competition: CompetitionWidgetItem }

const TONE_CLASS: Record<'today' | 'tomorrow' | 'future', string> = {
  today: 'text-primary',
  tomorrow: 'text-emerald-600 dark:text-emerald-400',
  future: 'text-muted-foreground',
}

function buildAgenda(
  sessions: SessionWidgetItem[],
  competitions: CompetitionWidgetItem[]
): AgendaEntry[] {
  const entries: AgendaEntry[] = [
    ...sessions.map((s) => ({ kind: 'session' as const, date: s.date, session: s })),
    ...competitions.map((c) => ({ kind: 'competition' as const, date: c.date, competition: c })),
  ]
  return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function AgendaTimeline({
  sessions,
  competitions,
  showLinkedBadge,
  canCreate,
}: {
  sessions: SessionWidgetItem[]
  competitions: CompetitionWidgetItem[]
  showLinkedBadge: boolean
  canCreate: boolean
}) {
  const agenda = buildAgenda(sessions, competitions).slice(0, 6)
  const [hero, ...rest] = agenda

  // La compétition la plus proche doit toujours avoir sa propre vitrine, même
  // quand une séance passe devant elle chronologiquement pour le hero.
  const spotlightCompetition = hero?.kind === 'session' ? (competitions[0] ?? null) : null
  const rail = spotlightCompetition
    ? rest.filter(
        (e) => !(e.kind === 'competition' && e.competition.id === spotlightCompetition.id)
      )
    : rest

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Zap className="size-3.5 text-primary" />À venir
        </h2>
        <Link
          href="/calendar"
          className="group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Calendrier
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {!hero ? (
        <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Rien de prévu pour l&apos;instant</p>
          {canCreate && (
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link href="/calendar" className="text-sm font-medium text-primary hover:underline">
                + Créer une séance
              </Link>
              <Link
                href="/competitions/new"
                className="text-sm font-medium text-primary hover:underline"
              >
                + Ajouter une compétition
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lg:col-span-3"
          >
            <HeroCard entry={hero} showLinkedBadge={showLinkedBadge} />
          </motion.div>

          <div className="lg:col-span-2 space-y-3">
            {spotlightCompetition && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
              >
                <CompetitionSpotlight
                  competition={spotlightCompetition}
                  showLinkedBadge={showLinkedBadge}
                />
              </motion.div>
            )}

            {rail.length > 0 && (
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="relative border-l border-border py-1 pl-6"
              >
                {rail.map((entry) => (
                  <motion.div key={`${entry.kind}-${entry.date.getTime()}`} variants={itemVariants}>
                    <TimelineRow entry={entry} showLinkedBadge={showLinkedBadge} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CompetitionSpotlight({
  competition,
  showLinkedBadge,
}: {
  competition: CompetitionWidgetItem
  showLinkedBadge: boolean
}) {
  const day = relativeDayLabel(competition.date)
  return (
    <Link
      href={`/competitions/${competition.id}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: `${competition.colorBg}14`,
        borderColor: `${competition.colorBg}4d`,
        boxShadow: `0 8px 24px -14px ${competition.colorBg}55`,
      }}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${competition.colorBg}26`, color: competition.colorBg }}
      >
        <Trophy className="size-5" fill="currentColor" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
          <span style={{ color: competition.colorBg }}>Prochaine compétition</span>
          <span className={cn('normal-case', TONE_CLASS[day.tone])}>· {day.label}</span>
        </div>
        <div className="truncate text-base font-extrabold">{competition.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[competition.location, formatShortDate(competition.date)].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          <Users className="size-2.5" />
          {competition.registrationCount}
        </span>
        {showLinkedBadge && competition.isRegistered && (
          <span className="text-[10px] font-semibold" style={{ color: competition.colorBg }}>
            Inscrit·e
          </span>
        )}
      </div>
    </Link>
  )
}

function HeroCard({ entry, showLinkedBadge }: { entry: AgendaEntry; showLinkedBadge: boolean }) {
  if (entry.kind === 'session') {
    const { session } = entry
    return (
      <Link
        href={`/sessions/${session.id}`}
        className="group relative block h-full overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-cyan-400/5 p-6 shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/15"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary/25 blur-3xl transition-opacity duration-300 group-hover:opacity-80"
        />
        <div className="relative flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Zap className="size-3" fill="currentColor" />
          </span>
          <span className="text-primary">Prochaine séance</span>
          <span className="text-muted-foreground">·</span>
          <span className={TONE_CLASS[relativeDayLabel(session.date).tone]}>
            {relativeDayLabel(session.date).label}
          </span>
          <span className="font-normal text-muted-foreground normal-case">
            {formatShortDate(session.date)}
          </span>
        </div>
        <div className="relative mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">{session.title}</div>
            {session.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {session.description}
              </p>
            )}
            {session.trainingType && (
              <Badge
                className="mt-3 border"
                style={{
                  backgroundColor: `${session.trainingType.color}22`,
                  color: session.trainingType.color,
                  borderColor: `${session.trainingType.color}44`,
                }}
              >
                {session.trainingType.name}
              </Badge>
            )}
          </div>
          <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary/20">
            <ChevronRight className="size-4 text-primary" />
          </span>
        </div>
      </Link>
    )
  }

  const { competition } = entry
  return (
    <Link
      href={`/competitions/${competition.id}`}
      className="group relative block h-full overflow-hidden rounded-3xl border p-6 shadow-lg transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: `${competition.colorBg}12`,
        borderColor: `${competition.colorBg}44`,
        boxShadow: `0 10px 30px -15px ${competition.colorBg}33`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: `${competition.colorBg}40` }}
      />
      <div className="relative flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
        <span
          className="inline-flex size-5 items-center justify-center rounded-full"
          style={{ backgroundColor: `${competition.colorBg}22`, color: competition.colorBg }}
        >
          <Trophy className="size-3" fill="currentColor" />
        </span>
        <span style={{ color: competition.colorBg }}>Prochaine compétition</span>
        <span className="text-muted-foreground">·</span>
        <span className={TONE_CLASS[relativeDayLabel(competition.date).tone]}>
          {relativeDayLabel(competition.date).label}
        </span>
        <span className="font-normal text-muted-foreground normal-case">
          {formatShortDate(competition.date)}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground normal-case">
          <Users className="size-2.5" />
          {competition.registrationCount}
        </span>
      </div>
      <div className="relative mt-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">{competition.title}</div>
          {competition.location && (
            <p className="mt-2 text-sm text-muted-foreground">{competition.location}</p>
          )}
          <Badge
            className="mt-3 border"
            style={{
              backgroundColor: `${competition.colorBg}22`,
              color: competition.colorBg,
              borderColor: `${competition.colorBg}44`,
            }}
          >
            {competition.typeLabel}
          </Badge>
          {showLinkedBadge && competition.isRegistered && (
            <span className="ml-2 text-xs font-semibold" style={{ color: competition.colorBg }}>
              Tu es inscrit·e
            </span>
          )}
        </div>
        <span
          className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
          style={{ backgroundColor: `${competition.colorBg}1a` }}
        >
          <ChevronRight className="size-4" style={{ color: competition.colorBg }} />
        </span>
      </div>
    </Link>
  )
}

function TimelineRow({ entry, showLinkedBadge }: { entry: AgendaEntry; showLinkedBadge: boolean }) {
  const color =
    entry.kind === 'session'
      ? (entry.session.trainingType?.color ?? 'var(--primary)')
      : entry.competition.colorBg
  const href =
    entry.kind === 'session'
      ? `/sessions/${entry.session.id}`
      : `/competitions/${entry.competition.id}`
  const title = entry.kind === 'session' ? entry.session.title : entry.competition.title
  const subtitle =
    entry.kind === 'session'
      ? (entry.session.trainingType?.name ?? 'Séance')
      : [entry.competition.typeLabel, entry.competition.location].filter(Boolean).join(' · ')
  const day = relativeDayShort(entry.date)
  const Icon = entry.kind === 'session' ? Zap : Trophy
  const isCompetition = entry.kind === 'competition'

  return (
    <Link
      href={href}
      className={cn(
        'group relative mb-3 flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-sm transition-all duration-300 last:mb-0 hover:-translate-y-0.5 hover:shadow-lg',
        !isCompetition && 'border-border bg-card hover:border-primary/30 hover:shadow-primary/10'
      )}
      style={
        isCompetition
          ? {
              backgroundColor: `${color}0d`,
              borderColor: `${color}33`,
              boxShadow: `0 6px 16px -12px ${color}55`,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="absolute top-1/2 -left-[29px] size-2.5 -translate-y-1/2 rounded-full ring-4 ring-background"
        style={{ background: color }}
      />
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <Icon className="size-3.5" fill={isCompetition ? 'currentColor' : 'none'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[11px] font-bold',
            day.tone === 'today'
              ? 'bg-primary/15 text-primary'
              : day.tone === 'tomorrow'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {day.label}
        </span>
        {showLinkedBadge && isCompetition && entry.competition.isRegistered && (
          <div className="mt-1 text-[10px] font-semibold" style={{ color }}>
            Inscrit·e
          </div>
        )}
      </div>
    </Link>
  )
}
