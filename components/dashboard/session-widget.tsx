'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeDayLabel, relativeDayShort, formatShortDate } from '@/lib/date'
import type { SessionWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<'today' | 'tomorrow' | 'future', string> = {
  today: 'text-primary',
  tomorrow: 'text-emerald-600 dark:text-emerald-400',
  future: 'text-muted-foreground',
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Zap className="size-3.5 text-primary" />
          Entraînements
        </h2>
        <Link
          href="/calendar"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:shadow-md active:translate-y-0 active:scale-95"
        >
          Calendrier
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {nextSession ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Link
            href={`/sessions/${nextSession.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/8 to-cyan-400/10 p-5 mb-2.5 shadow-lg shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-primary/30 blur-3xl transition-opacity duration-300 group-hover:opacity-80"
            />
            <div className="relative flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide">
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary/25 text-primary">
                <Zap className="size-3" fill="currentColor" />
              </span>
              <span className="text-primary">Prochaine séance</span>
              <span className="text-muted-foreground">·</span>
              <span className={TONE_CLASS[relativeDayLabel(nextSession.date).tone]}>
                {relativeDayLabel(nextSession.date).label}
              </span>
              <span className="text-muted-foreground normal-case font-normal">
                {formatShortDate(nextSession.date)}
              </span>
            </div>
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold tracking-tight">{nextSession.title}</div>
                {nextSession.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {nextSession.description}
                  </p>
                )}
                {nextSession.trainingType && (
                  <Badge
                    className="mt-3 border"
                    style={{
                      backgroundColor: `${nextSession.trainingType.color}33`,
                      color: nextSession.trainingType.color,
                      borderColor: `${nextSession.trainingType.color}5c`,
                    }}
                  >
                    {nextSession.trainingType.name}
                  </Badge>
                )}
              </div>
              <span className="flex items-center justify-center size-8 rounded-full bg-primary/15 shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary/25">
                <ChevronRight className="size-4 text-primary" />
              </span>
            </div>
          </Link>
        </motion.div>
      ) : null}

      {rest.length > 0 ? (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {rest.map((session) => {
            const day = relativeDayShort(session.date)
            const color = session.trainingType?.color ?? 'var(--muted-foreground)'
            return (
              <motion.div key={session.id} variants={itemVariants}>
                <Link
                  href={`/sessions/${session.id}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                >
                  <span
                    className="relative size-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                    style={{ background: color, boxShadow: `0 0 0 3px ${color}33` }}
                  />
                  <div className="relative flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{session.title}</div>
                    {session.trainingType && (
                      <div className="text-xs text-muted-foreground">
                        {session.trainingType.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'relative text-[11px] font-bold shrink-0 rounded-full px-2 py-1',
                      day.tone === 'today'
                        ? 'bg-primary/20 text-primary'
                        : day.tone === 'tomorrow'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {day.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      ) : !nextSession ? (
        <div className="rounded-2xl border border-border bg-card text-center py-8 shadow-sm">
          <p className="text-sm text-muted-foreground">Aucune séance planifiée</p>
          <Link
            href="/calendar"
            className="text-sm text-primary font-medium hover:underline mt-2 inline-block"
          >
            + Créer une séance
          </Link>
        </div>
      ) : null}
    </div>
  )
}
