'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Trophy, Users, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { relativeDayLabel, relativeDayShort, formatShortDate } from '@/lib/date'
import { tint } from '@/lib/color'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import type { CompetitionWidgetItem } from '@/lib/dashboard'
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

function RegisteredDot({
  isRegistered,
  color,
  isLight,
  size = 22,
}: {
  isRegistered: boolean
  color: string
  isLight: boolean
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
        boxShadow: isRegistered ? `0 0 0 3px ${tint(color, isLight ? 50 : 20)}` : 'none',
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
  const isLight = useIsLightTheme()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-3.5 text-amber-500" />
          Compétitions
        </h2>
        <Link
          href="/calendar"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:shadow-md active:translate-y-0 active:scale-95"
        >
          Calendrier
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {nextCompetition ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Link
            href={`/competitions/${nextCompetition.id}`}
            className="group relative block overflow-hidden rounded-2xl border p-5 mb-2.5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hover-border)]"
            style={
              {
                backgroundColor: tint(nextCompetition.colorBg, isLight ? 22 : 7),
                borderColor: tint(nextCompetition.colorBg, isLight ? 50 : 27),
                boxShadow: `0 10px 30px -15px ${tint(nextCompetition.colorBg, isLight ? 45 : 20)}`,
                '--hover-border': tint(nextCompetition.colorBg, isLight ? 70 : 47),
              } as CSSProperties
            }
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full blur-3xl transition-opacity duration-300 opacity-60 group-hover:opacity-90"
              style={{ background: tint(nextCompetition.colorBg, isLight ? 55 : 25) }}
            />
            <div className="relative flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide">
              <span
                className="inline-flex items-center justify-center size-5 rounded-full"
                style={{
                  backgroundColor: tint(nextCompetition.colorBg, isLight ? 35 : 13),
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
                    isLight={isLight}
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
                    backgroundColor: tint(nextCompetition.colorBg, isLight ? 30 : 13),
                    color: nextCompetition.colorBg,
                    borderColor: tint(nextCompetition.colorBg, isLight ? 55 : 27),
                  }}
                >
                  {nextCompetition.typeLabel}
                </Badge>
              </div>
              <span
                className="flex items-center justify-center size-8 rounded-full shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-1"
                style={{ backgroundColor: tint(nextCompetition.colorBg, isLight ? 24 : 10) }}
              >
                <ChevronRight className="size-4" style={{ color: nextCompetition.colorBg }} />
              </span>
            </div>
          </Link>
        </motion.div>
      ) : null}

      {rest.length > 0 ? (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {rest.map((competition) => {
            const day = relativeDayShort(competition.date)
            return (
              <motion.div key={competition.id} variants={itemVariants}>
                <Link
                  href={`/competitions/${competition.id}`}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                >
                  <span
                    className="relative w-1 h-9 rounded shrink-0 transition-all duration-200 group-hover:h-10"
                    style={{
                      background: competition.colorBg,
                      boxShadow: `0 0 12px -2px ${tint(competition.colorBg, isLight ? 60 : 40)}`,
                    }}
                  />
                  <div className="relative flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{competition.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {competition.typeLabel}
                      {competition.location ? ` · ${competition.location}` : ''}
                    </div>
                  </div>
                  <div className="relative shrink-0 text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      {showLinkedBadge && (
                        <RegisteredDot
                          isRegistered={competition.isRegistered}
                          color={competition.colorBg}
                          isLight={isLight}
                          size={16}
                        />
                      )}
                      <span
                        className={cn(
                          'text-[11px] font-bold rounded-full px-2 py-0.5',
                          day.tone === 'today'
                            ? 'bg-primary/25 text-primary dark:bg-primary/20'
                            : day.tone === 'tomorrow'
                              ? 'bg-emerald-500/25 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
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
              </motion.div>
            )
          })}
        </motion.div>
      ) : !nextCompetition ? (
        <div className="rounded-2xl border border-border bg-card text-center py-8 shadow-sm">
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
