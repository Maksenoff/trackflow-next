'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Trophy, Users, Check, X } from 'lucide-react'
import { relativeDayLabel, relativeDayShort, formatShortDate } from '@/lib/date'
import { tint } from '@/lib/color'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import type { CompetitionWidgetItem } from '@/lib/dashboard'
import { MotionCta } from '@/components/dashboard/motion-cta'
import { cn } from '@/lib/utils'
import { legibleAccent } from '@/lib/color-contrast'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
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
      className="flex shrink-0 items-center justify-center rounded-full"
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

/* Seule expression de la couleur du type : la bordure gauche de la card et
   cette pill — jamais de fond de card saturé (correctif 2026-08-21, même
   règle que les séances). Toujours dérivée de CompetitionType.color (jamais
   codée en dur) : fond color/20, texte color, bordure color/40. */
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <Trophy className="size-3.5 text-amber-500" />
          Compétitions
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

      {nextCompetition ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Link
            href={`/competitions/${nextCompetition.id}`}
            className="group relative mb-3 block min-h-11 overflow-hidden rounded-2xl border border-l-[4px] border-border bg-card p-6 shadow-card-elevated transition-colors duration-200 hover:bg-primary/[0.03] dark:bg-card-elevated"
            style={{ borderLeftColor: nextCompetition.colorBg }}
          >
            <div className="relative mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                style={{
                  backgroundColor: `color-mix(in srgb, ${nextCompetition.colorBg} 20%, transparent)`,
                  color: legibleAccent(nextCompetition.colorBg),
                  borderColor: `color-mix(in srgb, ${nextCompetition.colorBg} 40%, transparent)`,
                }}
              >
                <Trophy className="size-3" fill="currentColor" />
                Prochaine compétition · {relativeDayLabel(nextCompetition.date).label}
              </span>
              <span className="font-normal text-muted-foreground normal-case">
                {formatShortDate(nextCompetition.date)}
              </span>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground normal-case">
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
                <div className="text-2xl font-bold tracking-tight">{nextCompetition.title}</div>
                {nextCompetition.location && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{nextCompetition.location}</p>
                )}
                <div className="mt-3">
                  <TypePill name={nextCompetition.typeLabel} color={nextCompetition.colorBg} />
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
          {rest.map((competition) => {
            const day = relativeDayShort(competition.date)
            return (
              <motion.div
                key={competition.id}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
              >
                <Link
                  href={`/competitions/${competition.id}`}
                  className="group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-2xl border border-l-[3px] border-border bg-card p-4 shadow-card transition-colors duration-200 hover:bg-primary/[0.03]"
                  style={{ borderLeftColor: competition.colorBg }}
                >
                  <div className="relative min-w-0 flex-1">
                    <div className="truncate text-base font-bold">{competition.title}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <TypePill name={competition.typeLabel} color={competition.colorBg} />
                      {competition.location && (
                        <span className="truncate text-xs text-muted-foreground">
                          {competition.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative flex shrink-0 flex-col items-end gap-1 text-right">
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
                          'rounded-full px-2 py-0.5 text-[11px] font-bold',
                          day.tone === 'today'
                            ? 'bg-primary/25 text-primary'
                            : day.tone === 'tomorrow'
                              ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {day.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-10 text-center shadow-card">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Trophy className="size-7" />
          </span>
          <div>
            <p className="text-sm font-medium">Aucune compétition planifiée</p>
            {canCreate && (
              <MotionCta className="mt-2 inline-block">
                <Link
                  href="/competitions/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-500/80 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-500/25"
                >
                  + Ajouter
                </Link>
              </MotionCta>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
