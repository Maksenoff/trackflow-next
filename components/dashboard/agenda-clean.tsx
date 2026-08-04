'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, Trophy, Users, Zap } from 'lucide-react'
import { daysUntil, formatShortDate } from '@/lib/date'
import type { CompetitionWidgetItem, SessionWidgetItem } from '@/lib/dashboard'

type AgendaEntry =
  | { kind: 'session'; date: Date; session: SessionWidgetItem }
  | { kind: 'competition'; date: Date; competition: CompetitionWidgetItem }

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

function bucketLabel(date: Date): string {
  const diff = daysUntil(date)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function AgendaClean({
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
  const agenda = buildAgenda(sessions, competitions).slice(0, 8)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <CalendarDays className="size-3.5 text-primary" />À venir
        </h2>
        <Link
          href="/calendar"
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          Calendrier →
        </Link>
      </div>

      {agenda.length === 0 ? (
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
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {agenda.map((entry, i) => {
            const showBucket =
              i === 0 || bucketLabel(entry.date) !== bucketLabel(agenda[i - 1].date)
            return (
              <motion.div key={`${entry.kind}-${entry.date.getTime()}`} variants={itemVariants}>
                {showBucket && (
                  <div className="border-b border-border bg-muted/40 px-4 py-1.5 text-[11px] font-bold text-muted-foreground capitalize">
                    {bucketLabel(entry.date)}
                  </div>
                )}
                <AgendaRow entry={entry} showLinkedBadge={showLinkedBadge} />
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

function AgendaRow({ entry, showLinkedBadge }: { entry: AgendaEntry; showLinkedBadge: boolean }) {
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
  const Icon = entry.kind === 'session' ? Zap : Trophy
  const isCompetition = entry.kind === 'competition'
  const isRegistered = isCompetition && entry.competition.isRegistered

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
    >
      <span className="w-0.5 shrink-0 self-stretch rounded-full" style={{ background: color }} />
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{ color }}
      >
        <Icon className="size-4" fill={isCompetition ? 'currentColor' : 'none'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {subtitle}
          {isCompetition && (
            <span className="inline-flex items-center gap-0.5">
              {' '}
              · <Users className="size-2.5" /> {entry.competition.registrationCount}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {showLinkedBadge && isRegistered && (
          <span className="text-[10px] font-semibold" style={{ color }}>
            Inscrit·e
          </span>
        )}
        {formatShortDate(entry.date)}
        <ChevronRight className="size-3.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}
