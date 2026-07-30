import Link from 'next/link'
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
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Entraînements
        </h2>
        <Link
          href="/calendar"
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          Calendrier <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {nextSession ? (
        <Link
          href={`/sessions/${nextSession.id}`}
          className="group relative block overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-cyan-400/5 p-5 mb-2.5 shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/15"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-primary/25 blur-3xl transition-opacity duration-300 group-hover:opacity-80"
          />
          <div className="relative flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide">
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary/20 text-primary">
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
                    backgroundColor: `${nextSession.trainingType.color}22`,
                    color: nextSession.trainingType.color,
                    borderColor: `${nextSession.trainingType.color}44`,
                  }}
                >
                  {nextSession.trainingType.name}
                </Badge>
              )}
            </div>
            <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary/20">
              <ChevronRight className="size-4 text-primary" />
            </span>
          </div>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b text-sm font-semibold text-muted-foreground">
            Séances à venir
          </div>
          {rest.map((session) => {
            const day = relativeDayShort(session.date)
            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: session.trainingType?.color ?? 'var(--muted-foreground)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{session.title}</div>
                  {session.trainingType && (
                    <div className="text-xs text-muted-foreground">{session.trainingType.name}</div>
                  )}
                </div>
                <div className={cn('text-xs font-semibold shrink-0', TONE_CLASS[day.tone])}>
                  {day.label}
                </div>
              </Link>
            )
          })}
        </div>
      ) : !nextSession ? (
        <div className="rounded-xl border bg-card text-center py-8">
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
