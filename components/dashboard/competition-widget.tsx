import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRight, ChevronRight, Trophy, Users, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeDayLabel, relativeDayShort, formatShortDate } from '@/lib/date'
import type { CompetitionWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<'today' | 'tomorrow' | 'future', string> = {
  today: 'text-primary',
  tomorrow: 'text-emerald-600 dark:text-emerald-400',
  future: 'text-muted-foreground',
}

function RegisteredDot({
  isRegistered,
  color,
  size = 22,
}: {
  isRegistered: boolean
  color: string
  size?: number
}) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: isRegistered ? color : 'var(--muted)',
        border: isRegistered ? 'none' : '1.5px solid var(--border)',
        boxShadow: isRegistered ? `0 0 0 3px ${color}33` : 'none',
      }}
    >
      {isRegistered ? (
        <Check
          className="text-white"
          style={{ width: size * 0.5, height: size * 0.5 }}
          strokeWidth={3}
        />
      ) : (
        <X
          className="text-muted-foreground"
          style={{ width: size * 0.4, height: size * 0.4 }}
          strokeWidth={2.5}
        />
      )}
    </span>
  )
}

export function CompetitionWidget({
  nextCompetition,
  upcomingCompetitions,
  showLinkedBadge,
  canCreate,
}: {
  nextCompetition: CompetitionWidgetItem | null
  upcomingCompetitions: CompetitionWidgetItem[]
  showLinkedBadge: boolean
  canCreate: boolean
}) {
  const rest = upcomingCompetitions.filter((c) => c.id !== nextCompetition?.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Compétitions
        </h2>
        <Link
          href="/calendar"
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          Calendrier <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {nextCompetition ? (
        <Link
          href={`/competitions/${nextCompetition.id}`}
          className="group relative block overflow-hidden rounded-xl border p-5 mb-2.5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hover-border)]"
          style={
            {
              backgroundColor: `${nextCompetition.colorBg}12`,
              borderColor: `${nextCompetition.colorBg}44`,
              boxShadow: `0 10px 30px -15px ${nextCompetition.colorBg}33`,
              '--hover-border': `${nextCompetition.colorBg}77`,
            } as CSSProperties
          }
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full blur-3xl transition-opacity duration-300 opacity-60 group-hover:opacity-90"
            style={{ background: `${nextCompetition.colorBg}40` }}
          />
          <div className="relative flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide">
            <span
              className="inline-flex items-center justify-center size-5 rounded-full"
              style={{
                backgroundColor: `${nextCompetition.colorBg}22`,
                color: nextCompetition.colorBg,
              }}
            >
              <Trophy className="size-3" fill="currentColor" />
            </span>
            <span style={{ color: nextCompetition.colorBg }}>Prochaine compétition</span>
            <span className="text-muted-foreground">·</span>
            <span className={TONE_CLASS[relativeDayLabel(nextCompetition.date).tone]}>
              {relativeDayLabel(nextCompetition.date).label}
            </span>
            <span className="text-muted-foreground normal-case font-normal">
              {formatShortDate(nextCompetition.date)}
            </span>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted border text-[11px] font-bold text-muted-foreground normal-case">
                <Users className="size-2.5" />
                {nextCompetition.registrationCount}
              </span>
              {showLinkedBadge && (
                <RegisteredDot
                  isRegistered={nextCompetition.isRegistered}
                  color={nextCompetition.colorBg}
                />
              )}
            </div>
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold tracking-tight">{nextCompetition.title}</div>
              {nextCompetition.location && (
                <p className="text-sm text-muted-foreground mt-1.5">{nextCompetition.location}</p>
              )}
              <Badge
                className="mt-3 border"
                style={{
                  backgroundColor: `${nextCompetition.colorBg}22`,
                  color: nextCompetition.colorBg,
                  borderColor: `${nextCompetition.colorBg}44`,
                }}
              >
                {nextCompetition.typeLabel}
              </Badge>
            </div>
            <span
              className="flex items-center justify-center size-8 rounded-full shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1"
              style={{ backgroundColor: `${nextCompetition.colorBg}1a` }}
            >
              <ChevronRight className="size-4" style={{ color: nextCompetition.colorBg }} />
            </span>
          </div>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b text-sm font-semibold text-muted-foreground">
            À venir
          </div>
          {rest.map((competition) => {
            const day = relativeDayShort(competition.date)
            return (
              <Link
                key={competition.id}
                href={`/competitions/${competition.id}`}
                className="group flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                <span
                  className="w-1 h-9 rounded shrink-0 transition-all duration-200 group-hover:h-10"
                  style={{
                    background: competition.colorBg,
                    boxShadow: `0 0 12px -2px ${competition.colorBg}66`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{competition.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {competition.typeLabel}
                    {competition.location ? ` · ${competition.location}` : ''}
                  </div>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    {showLinkedBadge && (
                      <RegisteredDot
                        isRegistered={competition.isRegistered}
                        color={competition.colorBg}
                        size={16}
                      />
                    )}
                    <span
                      className={cn(
                        'text-[11px] font-bold rounded-full px-2 py-0.5',
                        day.tone === 'today'
                          ? 'bg-primary/15 text-primary'
                          : day.tone === 'tomorrow'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {day.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Users className="size-2.5" />
                    {competition.registrationCount}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : !nextCompetition ? (
        <div className="rounded-xl border bg-card text-center py-8">
          <p className="text-sm text-muted-foreground">Aucune compétition planifiée</p>
          {canCreate && (
            <Link
              href="/competitions/new"
              className="text-sm text-primary font-medium hover:underline mt-2 inline-block"
            >
              + Ajouter
            </Link>
          )}
        </div>
      ) : null}
    </div>
  )
}
