'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, List, MapPin, Trophy, UserRound } from 'lucide-react'
import { initials } from '@/lib/athlete'
import { formatFullDate } from '@/lib/date'
import { cn } from '@/lib/utils'

export type PodiumItem = {
  id: string
  year: number
  rank: number
  label: string
  level: string
  discipline: string
  performance: string | null
  recordedAt: Date
  venue: string | null
}

type AthleteInfo = {
  firstName: string
  lastName: string
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
}

const RANK_STYLES: Record<number, { badge: string; ring: string; step: string }> = {
  1: {
    badge: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-yellow-950',
    ring: 'ring-amber-400',
    step: 'from-amber-400/25 to-amber-500/5 border-amber-400/40',
  },
  2: {
    badge: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800',
    ring: 'ring-slate-300',
    step: 'from-slate-300/25 to-slate-400/5 border-slate-300/40',
  },
  3: {
    badge: 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-orange-950',
    ring: 'ring-orange-400',
    step: 'from-orange-400/25 to-orange-500/5 border-orange-400/40',
  },
}

const STEP_HEIGHT: Record<number, string> = {
  1: 'h-28 sm:h-36',
  2: 'h-20 sm:h-28',
  3: 'h-14 sm:h-20',
}
const STEP_ORDER = [2, 1, 3]

type ViewMode = 'list' | 'years'

export function PodiumsView({ podiums, athlete }: { podiums: PodiumItem[]; athlete: AthleteInfo }) {
  const [mode, setMode] = useState<ViewMode>('years')

  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
        {(
          [
            { key: 'years' as const, label: 'Par année', icon: Trophy },
            { key: 'list' as const, label: 'Liste', icon: List },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setMode(opt.key)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              mode === opt.key
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {mode === opt.key && (
              <motion.span
                layoutId="podiums-view-mode"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            )}
            <opt.icon className="size-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'list' ? (
        <PodiumListView podiums={podiums} />
      ) : (
        <PodiumSliderView podiums={podiums} athlete={athlete} />
      )}
    </div>
  )
}

function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const style = RANK_STYLES[rank] ?? RANK_STYLES[3]
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow-sm',
        style.badge,
        className
      )}
    >
      {rank}
    </span>
  )
}

function PodiumListView({ podiums }: { podiums: PodiumItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        {podiums.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <RankBadge rank={p.rank} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="truncate text-sm font-bold">{p.discipline}</span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {p.level}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{p.label}</div>
            </div>
            <div className="shrink-0 text-right">
              {p.performance && (
                <div className="font-mono text-sm font-bold tabular-nums">{p.performance}</div>
              )}
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                {formatFullDate(p.recordedAt)}
                {p.venue && (
                  <>
                    <MapPin className="size-3 shrink-0" />
                    {p.venue}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Chaque résultat correspond à un podium distinct (une seule compétition) : on ne
 * connaît que le classement de notre athlète, pas les 2 autres personnes présentes
 * sur les marches qu'il n'occupe pas — celles-ci restent donc une icône générique.
 */
function PodiumSliderView({ podiums, athlete }: { podiums: PodiumItem[]; athlete: AthleteInfo }) {
  const ordered = useMemo(
    () => [...podiums].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [podiums]
  )
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const current = ordered[index]

  function go(delta: number) {
    setDirection(delta)
    setIndex((i) => Math.min(Math.max(i + delta, 0), ordered.length - 1))
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 && index < ordered.length - 1) go(1)
    else if (info.offset.x > 60 && index > 0) go(-1)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Compétition précédente"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <div className="text-lg font-extrabold tracking-tight">{current.year}</div>
          <div className="text-xs text-muted-foreground">
            {index + 1} / {ordered.length}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === ordered.length - 1}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Compétition suivante"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current.id}
            custom={direction}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="touch-pan-y space-y-4"
          >
            <div className="text-center">
              <div className="text-sm font-bold">{current.discipline}</div>
              <div className="text-xs text-muted-foreground">
                {current.level} · {formatFullDate(current.recordedAt)}
                {current.venue ? ` · ${current.venue}` : ''}
              </div>
            </div>

            <div className="mx-auto flex max-w-lg items-end justify-center gap-2 sm:gap-4">
              {STEP_ORDER.map((rank) => {
                const isOurs = rank === current.rank
                const style = RANK_STYLES[rank]
                return (
                  <div key={rank} className="flex flex-1 flex-col items-center gap-2">
                    {isOurs ? (
                      <div
                        className={cn(
                          'flex size-14 items-center justify-center rounded-full ring-4 ring-offset-2 ring-offset-background sm:size-16',
                          style.ring
                        )}
                      >
                        {athlete.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={athlete.photoUrl}
                            alt=""
                            className="size-full rounded-full object-cover"
                            style={{
                              objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                              transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                              transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                            }}
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground">
                            {initials(athlete.firstName, athlete.lastName)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground/50 sm:size-16">
                        <UserRound className="size-6" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border bg-gradient-to-b pt-2',
                        STEP_HEIGHT[rank],
                        style.step
                      )}
                    >
                      <RankBadge rank={rank} />
                      {isOurs && (
                        <span className="px-1 text-center text-[10px] font-semibold text-muted-foreground">
                          {current.performance ?? current.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
