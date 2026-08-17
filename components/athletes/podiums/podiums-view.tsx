'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  List,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { initials } from '@/lib/athlete'
import { formatFullDate } from '@/lib/date'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import { cn } from '@/lib/utils'
import { MEDAL_GRADIENTS, type MedalRank } from './medal-colors'
import { PodiumFormDialog } from './podium-form-dialog'

export type PodiumItem = {
  id: string
  year: number
  rank: number
  label: string | null
  level: string
  discipline: string
  performance: string | null
  recordedAt: Date
  venue: string | null
  source: 'ffa' | 'manual'
}

type AthleteInfo = {
  firstName: string
  lastName: string
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
}

const STEP_HEIGHT: Record<number, string> = {
  1: 'h-28 sm:h-36',
  2: 'h-20 sm:h-28',
  3: 'h-12 sm:h-16',
}
const STEP_ORDER = [2, 1, 3]

function medalStyle(rank: number) {
  return MEDAL_GRADIENTS[(rank in MEDAL_GRADIENTS ? rank : 3) as MedalRank]
}

type ViewMode = 'list' | 'years'

export function PodiumsView({
  podiums,
  athlete,
  athleteId,
  canEdit,
}: {
  podiums: PodiumItem[]
  athlete: AthleteInfo
  athleteId: string
  canEdit: boolean
}) {
  const [mode, setMode] = useState<ViewMode>('years')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PodiumItem | null>(null)

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 }
    for (const p of podiums) {
      if (p.rank === 1 || p.rank === 2 || p.rank === 3) c[p.rank]++
    }
    return c
  }, [podiums])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(p: PodiumItem) {
    setEditing(p)
    setFormOpen(true)
  }

  if (podiums.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center shadow-sm">
        <Trophy className="mx-auto mb-3 size-9 text-muted-foreground/50" />
        <p className="mb-1 text-lg font-extrabold">Aucun podium pour le moment</p>
        <p className="mb-5 text-sm text-muted-foreground">
          Synchronise avec athle.fr ou ajoute-en un manuellement.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
          >
            <Plus className="size-4" />
            Ajouter un podium
          </button>
        )}
        <PodiumFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          athleteId={athleteId}
          editing={editing}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {([1, 2, 3] as const).map((rank) => {
          const style = medalStyle(rank)
          return (
            <div
              key={rank}
              className="relative overflow-hidden rounded-2xl border p-4 shadow-sm"
              style={{ background: style.step, borderColor: style.border }}
            >
              <div
                aria-hidden
                className="absolute -top-6 -right-6 size-20 rounded-full blur-2xl"
                style={{ background: style.ring, opacity: 0.25 }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black shadow-sm"
                  style={{ background: style.disc, borderColor: style.ring, color: style.text }}
                >
                  {rank}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-black tabular-nums" style={{ color: style.ring }}>
                    {counts[rank]}
                  </div>
                  <div className="truncate text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                    {style.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-bold shadow-sm transition-colors hover:bg-muted/60"
          >
            <Plus className="size-4" />
            Ajouter
          </button>
        )}
      </div>

      {mode === 'list' ? (
        <PodiumListView
          podiums={podiums}
          athleteId={athleteId}
          canEdit={canEdit}
          onEdit={openEdit}
        />
      ) : (
        <PodiumSliderView
          podiums={podiums}
          athlete={athlete}
          athleteId={athleteId}
          canEdit={canEdit}
          onEdit={openEdit}
        />
      )}

      <PodiumFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        athleteId={athleteId}
        editing={editing}
      />
    </div>
  )
}

function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const style = medalStyle(rank)
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full border font-black shadow-sm',
        className
      )}
      style={{ background: style.disc, borderColor: style.ring, color: style.text }}
    >
      {rank}
    </span>
  )
}

async function deletePodium(athleteId: string, podiumId: string) {
  const res = await fetch(`/api/athletes/${athleteId}/podiums/${podiumId}`, { method: 'DELETE' })
  return res.ok
}

function RowActions({
  podium,
  athleteId,
  onEdit,
}: {
  podium: PodiumItem
  athleteId: string
  onEdit: (p: PodiumItem) => void
}) {
  const router = useRouter()
  if (podium.source !== 'manual') return null

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onEdit(podium)
        }}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Modifier"
      >
        <Pencil className="size-3" />
      </button>
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation()
          if (!window.confirm('Supprimer ce podium ?')) return
          const ok = await deletePodium(athleteId, podium.id)
          if (!ok) {
            toast.error('Suppression impossible.')
            return
          }
          router.refresh()
        }}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Supprimer"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  )
}

function PodiumListView({
  podiums,
  athleteId,
  canEdit,
  onEdit,
}: {
  podiums: PodiumItem[]
  athleteId: string
  canEdit: boolean
  onEdit: (p: PodiumItem) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        {podiums.map((p) => {
          const style = medalStyle(p.rank)
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2 pr-4 pl-3 sm:pr-5"
              style={{ borderLeft: `3px solid ${style.ring}` }}
            >
              <RankBadge rank={p.rank} className="size-6 text-[11px]" />
              <div className="min-w-0 flex-1 truncate text-sm">
                <span className="font-extrabold">{p.discipline}</span>
                <span className="text-muted-foreground"> · {p.level}</span>
              </div>
              <div className="shrink-0 text-right text-xs font-semibold text-muted-foreground">
                {formatFullDate(p.recordedAt)}
              </div>
              {p.performance && (
                <div className="hidden w-16 shrink-0 text-right font-mono text-xs font-bold tabular-nums sm:block">
                  {p.performance}
                </div>
              )}
              {canEdit && <RowActions podium={p} athleteId={athleteId} onEdit={onEdit} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Chaque résultat correspond à un podium distinct (une seule compétition) : on ne
 * connaît que le classement de notre athlète, pas les 2 autres personnes présentes
 * sur les marches qu'il n'occupe pas — celles-ci restent donc une icône générique.
 */
function PodiumSliderView({
  podiums,
  athlete,
  athleteId,
  canEdit,
  onEdit,
}: {
  podiums: PodiumItem[]
  athlete: AthleteInfo
  athleteId: string
  canEdit: boolean
  onEdit: (p: PodiumItem) => void
}) {
  const isLight = useIsLightTheme()
  const years = useMemo(
    () => Array.from(new Set(podiums.map((p) => p.year))).sort((a, b) => b - a),
    [podiums]
  )
  const [year, setYear] = useState(years[0])
  const yearPodiums = useMemo(
    () =>
      podiums
        .filter((p) => p.year === year)
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [podiums, year]
  )
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const current = yearPodiums[index]
  const currentStyle = medalStyle(current.rank)

  function selectYear(y: number) {
    setYear(y)
    setIndex(0)
    setDirection(1)
  }

  function go(delta: number) {
    setDirection(delta)
    setIndex((i) => Math.min(Math.max(i + delta, 0), yearPodiums.length - 1))
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 && index < yearPodiums.length - 1) go(1)
    else if (info.offset.x > 60 && index > 0) go(-1)
  }

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => selectYear(y)}
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-black transition-colors',
              y === year
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Scène podium */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              `repeating-linear-gradient(115deg, ${isLight ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.04)'} 0px, ${isLight ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.04)'} 1px, transparent 1px, transparent 14px)`,
              `radial-gradient(120% 90% at 50% 110%, ${currentStyle.ring}22, transparent 60%)`,
            ].join(', '),
          }}
        />

        <div className="relative flex items-center justify-between gap-3 px-5 pt-5 sm:px-7">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            aria-label="Compétition précédente"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="min-w-0 text-center">
            <div className="truncate text-base font-black tracking-tight sm:text-lg">
              {current.discipline}
            </div>
            <div className="truncate text-xs font-semibold text-muted-foreground">
              {current.level} · {formatFullDate(current.recordedAt)}
              {current.venue ? ` · ${current.venue}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === yearPodiums.length - 1}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            aria-label="Compétition suivante"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="relative flex items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {index + 1} / {yearPodiums.length}
          </span>
          {canEdit && <RowActions podium={current} athleteId={athleteId} onEdit={onEdit} />}
        </div>

        <div className="relative overflow-hidden px-4 pb-6 sm:px-8">
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
              className="touch-pan-y"
            >
              <div className="mx-auto flex max-w-md items-end justify-center gap-3 sm:gap-6">
                {STEP_ORDER.map((rank) => {
                  const isOurs = rank === current.rank
                  const style = medalStyle(rank)
                  return (
                    <div key={rank} className="flex flex-1 flex-col items-center">
                      <div className="relative mb-1 flex items-end justify-center pb-4">
                        {isOurs ? (
                          <>
                            <span
                              aria-hidden
                              className="absolute top-1 left-1/2 h-8 w-3 -translate-x-[15px] rotate-[24deg] rounded-full"
                              style={{ background: style.ring }}
                            />
                            <span
                              aria-hidden
                              className="absolute top-1 left-1/2 h-8 w-3 translate-x-[3px] -rotate-[24deg] rounded-full"
                              style={{ background: style.ring }}
                            />
                            <div
                              className="relative z-10 size-16 overflow-hidden rounded-full ring-4 ring-card sm:size-20"
                              style={{ boxShadow: style.glow }}
                            >
                              {athlete.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={athlete.photoUrl}
                                  alt=""
                                  className="size-full object-cover"
                                  style={{
                                    objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                                    transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                                    transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                                  }}
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-base font-bold text-primary-foreground">
                                  {initials(athlete.firstName, athlete.lastName)}
                                </div>
                              )}
                            </div>
                            <div
                              className="absolute -bottom-1 left-1/2 z-20 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 text-sm font-black sm:size-9"
                              style={{
                                background: style.disc,
                                borderColor: style.ring,
                                color: style.text,
                                boxShadow: style.glow,
                              }}
                            >
                              {rank}
                            </div>
                          </>
                        ) : (
                          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/40 sm:size-20">
                            <UserRound className="size-7" />
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          'flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border pt-2.5',
                          STEP_HEIGHT[rank]
                        )}
                        style={{ background: style.step, borderColor: style.border }}
                      >
                        <span className="text-sm font-black" style={{ color: style.ring }}>
                          {rank}
                          {rank === 1 ? 'er' : 'ème'}
                        </span>
                        {isOurs && current.performance && (
                          <span className="px-1 text-center font-mono text-[11px] font-bold text-muted-foreground">
                            {current.performance}
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

      <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="mb-1 px-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          Tous les podiums {year} ({yearPodiums.length})
        </p>
        {yearPodiums.map((p, i) => {
          const style = medalStyle(p.rank)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1)
                setIndex(i)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl py-1.5 pr-2 pl-2.5 text-left transition-colors',
                i === index ? 'bg-muted/60' : 'hover:bg-muted/40'
              )}
              style={{ borderLeft: `3px solid ${i === index ? style.ring : 'transparent'}` }}
            >
              <RankBadge rank={p.rank} className="size-5 text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-xs font-bold">{p.discipline}</span>
              <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                {formatFullDate(p.recordedAt)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
