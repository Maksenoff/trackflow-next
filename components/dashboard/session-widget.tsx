'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Clock, Hourglass, Zap } from 'lucide-react'
import {
  relativeDayLabel,
  relativeDayShort,
  formatShortDate,
  formatTime,
  formatDuration,
} from '@/lib/date'
import type { SessionWidgetItem } from '@/lib/dashboard'
import { MotionCta } from '@/components/dashboard/motion-cta'
import { cn } from '@/lib/utils'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function SessionMeta({ session }: { session: SessionWidgetItem }) {
  if (!session.startTime && !session.durationMinutes) return null
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {session.startTime && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatTime(session.startTime)}
        </span>
      )}
      {session.durationMinutes && (
        <span className="inline-flex items-center gap-1">
          <Hourglass className="size-3" />
          {formatDuration(session.durationMinutes)}
        </span>
      )}
    </span>
  )
}

// Pastille verte/rouge + prénom du coach — même code visuel que l'aperçu au
// survol du calendrier (HoverPreview dans calendar-view.tsx).
function CoachTag({ session, className }: { session: SessionWidgetItem; className?: string }) {
  if (!session.coach) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          session.coachPresent ? 'bg-emerald-500' : 'bg-rose-500'
        )}
      />
      {session.coach.firstName}
    </span>
  )
}

/* Seule expression de la couleur du type : la bordure gauche de la card et
   cette pill — jamais de fond de card saturé (cf. CLAUDE.md §7 / correctif
   2026-08-21, même règle que les compétitions). Toujours dérivée de
   TrainingType.color (jamais une couleur codée en dur) : fond color/20,
   texte color, bordure color/40. */
function TypePill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        color,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      {name}
    </span>
  )
}

export function SessionWidget({
  nextSession,
  upcomingSessions,
}: {
  nextSession: SessionWidgetItem | null
  upcomingSessions: SessionWidgetItem[]
}) {
  const rest = upcomingSessions.filter((s) => s.id !== nextSession?.id)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <Zap className="size-3.5 text-primary" />
          Entraînements
        </h2>
        <MotionCta>
          <Link
            href="/calendar"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Calendrier
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </MotionCta>
      </div>

      {nextSession ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Link
            href={`/sessions/${nextSession.id}`}
            className="group relative mb-3 block min-h-11 overflow-hidden rounded-2xl border border-l-[4px] border-border bg-card p-6 shadow-card-elevated transition-colors duration-200 hover:bg-primary/[0.03] dark:bg-card-elevated"
            style={{ borderLeftColor: nextSession.trainingType?.color ?? 'var(--primary)' }}
          >
            <div className="relative mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                style={{
                  backgroundColor: `color-mix(in srgb, ${nextSession.trainingType?.color ?? '#5b21b6'} 20%, transparent)`,
                  color: nextSession.trainingType?.color ?? 'var(--primary)',
                  borderColor: `color-mix(in srgb, ${nextSession.trainingType?.color ?? '#5b21b6'} 40%, transparent)`,
                }}
              >
                <Zap className="size-3" fill="currentColor" />
                Prochaine séance · {relativeDayLabel(nextSession.date).label}
              </span>
              <span className="font-normal text-muted-foreground normal-case">
                {formatShortDate(nextSession.date)}
              </span>
              <CoachTag session={nextSession} className="ml-auto" />
            </div>
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold tracking-tight">{nextSession.title}</div>
                {nextSession.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {nextSession.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {nextSession.trainingType && (
                    <TypePill
                      name={nextSession.trainingType.name}
                      color={nextSession.trainingType.color}
                    />
                  )}
                  <SessionMeta session={nextSession} />
                </div>
              </div>
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary/25">
                <ChevronRight className="size-4 text-primary" />
              </span>
            </div>
          </Link>
        </motion.div>
      ) : null}

      {rest.length > 0 ? (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2.5">
          {rest.map((session) => {
            const day = relativeDayShort(session.date)
            const color = session.trainingType?.color ?? 'var(--primary)'
            return (
              <motion.div
                key={session.id}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
              >
                <Link
                  href={`/sessions/${session.id}`}
                  className="group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-2xl border border-l-[3px] border-border bg-card p-4 shadow-card transition-colors duration-200 hover:bg-primary/[0.03]"
                  style={{ borderLeftColor: color }}
                >
                  <div className="relative min-w-0 flex-1">
                    <div className="truncate text-base font-medium">{session.title}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {session.trainingType && (
                        <TypePill name={session.trainingType.name} color={color} />
                      )}
                      <SessionMeta session={session} />
                    </div>
                  </div>
                  <div className="relative flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-[11px] font-bold',
                        day.tone === 'today'
                          ? 'bg-primary/25 text-primary'
                          : day.tone === 'tomorrow'
                            ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {day.label}
                    </span>
                    <CoachTag session={session} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      ) : !nextSession ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-10 text-center shadow-card">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Zap className="size-7" />
          </span>
          <div>
            <p className="text-sm font-medium">Aucune séance planifiée</p>
            <MotionCta className="mt-2 inline-block">
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover"
              >
                + Créer une séance
              </Link>
            </MotionCta>
          </div>
        </div>
      ) : null}
    </div>
  )
}
