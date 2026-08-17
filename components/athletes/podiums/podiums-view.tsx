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
  1: 'h-24 sm:h-32',
  2: 'h-16 sm:h-24',
  3: 'h-10 sm:h-16',
}
const STEP_ORDER = [2, 1, 3]

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
        <p className="mb-1 font-bold">Aucun podium pour le moment</p>
        <p className="mb-5 text-sm text-muted-foreground">
          Synchronise avec athle.fr ou ajoute-en un manuellement.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-muted/60"
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
  const style = MEDAL_GRADIENTS[(rank in MEDAL_GRADIENTS ? rank : 3) as MedalRank]
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full border font-extrabold shadow-sm',
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
        {podiums.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 px-4 py-2 sm:px-5">
            <RankBadge rank={p.rank} className="size-6 text-[11px]" />
            <div className="min-w-0 flex-1 truncate text-sm">
              <span className="font-bold">{p.discipline}</span>
              <span className="text-muted-foreground"> · {p.level}</span>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              {formatFullDate(p.recordedAt)}
            </div>
            {p.performance && (
              <div className="hidden w-16 shrink-0 text-right font-mono text-xs font-bold tabular-nums sm:block">
                {p.performance}
              </div>
            )}
            {canEdit && <RowActions podium={p} athleteId={athleteId} onEdit={onEdit} />}
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
  const currentStyle =
    MEDAL_GRADIENTS[(current.rank in MEDAL_GRADIENTS ? current.rank : 3) as MedalRank]

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
    <div className="space-y-5">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => selectYear(y)}
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors',
              y === year
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {y}
          </button>
        ))}
      </div>

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
          <div className="text-lg font-extrabold tracking-tight">{year}</div>
          <div className="text-xs text-muted-foreground">
            {index + 1} / {yearPodiums.length}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === yearPodiums.length - 1}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Compétition suivante"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
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
            className="touch-pan-y space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold">{current.discipline}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {current.level} · {formatFullDate(current.recordedAt)}
                  {current.venue ? ` · ${current.venue}` : ''}
                </div>
              </div>
              {canEdit && <RowActions podium={current} athleteId={athleteId} onEdit={onEdit} />}
            </div>

            <div className="mx-auto flex max-w-md items-end justify-center gap-3 sm:gap-5">
              {STEP_ORDER.map((rank) => {
                const isOurs = rank === current.rank
                const style = MEDAL_GRADIENTS[rank as MedalRank]
                return (
                  <div key={rank} className="flex flex-1 flex-col items-center">
                    <div className="relative mb-1 flex items-end justify-center pb-3">
                      {isOurs ? (
                        <>
                          {/* rubans */}
                          <span
                            aria-hidden
                            className="absolute top-1 left-1/2 h-7 w-2.5 -translate-x-[13px] rotate-[24deg] rounded-full"
                            style={{ background: style.ring }}
                          />
                          <span
                            aria-hidden
                            className="absolute top-1 left-1/2 h-7 w-2.5 translate-x-[3px] -rotate-[24deg] rounded-full"
                            style={{ background: style.ring }}
                          />
                          <div className="relative z-10 size-16 overflow-hidden rounded-full ring-4 ring-card sm:size-[4.5rem]">
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
                              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground">
                                {initials(athlete.firstName, athlete.lastName)}
                              </div>
                            )}
                          </div>
                          {/* médaille */}
                          <div
                            className="absolute -bottom-1 left-1/2 z-20 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border-2 text-xs font-extrabold sm:size-8"
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
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/40 sm:size-[4.5rem]">
                          <UserRound className="size-6" />
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border pt-2',
                        STEP_HEIGHT[rank]
                      )}
                      style={{ background: style.step, borderColor: style.border }}
                    >
                      <span className="text-xs font-extrabold" style={{ color: style.ring }}>
                        {rank}
                        {rank === 1 ? 'er' : 'ème'}
                      </span>
                      {isOurs && current.performance && (
                        <span className="px-1 text-center text-[10px] font-semibold text-muted-foreground">
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

      <div
        className="rounded-2xl border p-3"
        style={{ background: currentStyle.step, borderColor: currentStyle.border }}
      >
        <p className="mb-2 px-1 text-xs font-bold text-muted-foreground">
          Tous les podiums {year} ({yearPodiums.length})
        </p>
        <div className="space-y-1">
          {yearPodiums.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1)
                setIndex(i)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                i === index ? 'bg-card shadow-sm' : 'hover:bg-card/60'
              )}
            >
              <RankBadge rank={p.rank} className="size-5 text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-xs font-bold">{p.discipline}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatFullDate(p.recordedAt)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
