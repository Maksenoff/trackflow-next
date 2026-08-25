'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import {
  CalendarRange,
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
  1: 'h-24 sm:h-32',
  2: 'h-16 sm:h-24',
  3: 'h-10 sm:h-14',
}
const STEP_ORDER = [2, 1, 3]

function medalStyle(rank: number) {
  return MEDAL_GRADIENTS[(rank in MEDAL_GRADIENTS ? rank : 3) as MedalRank]
}

function rankOrdinal(rank: number) {
  return rank === 1 ? '1er' : `${rank}ème`
}

type ViewMode = 'grid' | 'list'

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
  const isLight = useIsLightTheme()
  const [mode, setMode] = useState<ViewMode>('grid')
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
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-selected px-4 py-2 text-sm font-bold text-white shadow-sm shadow-primary/25"
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
              className="relative flex items-center gap-2 overflow-hidden rounded-3xl border p-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:gap-3 sm:p-4"
              style={{
                borderColor: `color-mix(in srgb, ${style.ring} ${isLight ? 55 : 35}%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${style.ring} ${isLight ? 16 : 11}%, var(--card))`,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-5 -right-5 size-16 rounded-full blur-2xl"
                style={{ background: style.ring, opacity: isLight ? 0.35 : 0.25 }}
              />
              <span
                className="relative flex size-9 shrink-0 items-center justify-center rounded-2xl border-2 text-xs font-black shadow-sm sm:size-11 sm:text-sm"
                style={{ background: style.disc, borderColor: style.ring, color: style.text }}
              >
                {rank}
              </span>
              <div className="relative min-w-0">
                <div
                  className="text-xl font-black tabular-nums sm:text-2xl"
                  style={{ color: style.ring }}
                >
                  {counts[rank]}
                </div>
                <div className="truncate text-[9px] font-bold tracking-wide text-muted-foreground uppercase sm:text-[11px]">
                  {style.label}
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
              { key: 'grid' as const, label: 'Podiums', icon: Trophy },
              { key: 'list' as const, label: 'Liste', icon: List },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                mode === opt.key ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode === opt.key && (
                <motion.span
                  layoutId="podiums-view-mode"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-selected shadow-sm shadow-primary/25"
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
        <PodiumSceneView
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
      <div className="divide-y divide-border sm:hidden">
        {podiums.map((p) => {
          const style = medalStyle(p.rank)
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3"
              style={{ borderLeft: `3px solid ${style.ring}` }}
            >
              <RankBadge rank={p.rank} className="size-8 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold">{p.discipline}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.level} · {formatFullDate(p.recordedAt)}
                </div>
              </div>
              {p.performance && (
                <span
                  className="shrink-0 font-mono text-sm font-black tabular-nums"
                  style={{ color: style.ring }}
                >
                  {p.performance}
                </span>
              )}
              {canEdit && <RowActions podium={p} athleteId={athleteId} onEdit={onEdit} />}
            </div>
          )
        })}
      </div>

      <div className="no-scrollbar hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
              <th className="w-16 px-4 py-2 font-medium">Rang</th>
              <th className="px-3 py-2 font-medium">Discipline</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">Niveau</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">Lieu</th>
              <th className="w-28 px-3 py-2 font-medium">Date</th>
              <th className="w-32 px-4 py-2 text-right font-medium">Performance</th>
              {canEdit && <th className="w-16 px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {podiums.map((p) => {
              const style = medalStyle(p.rank)
              return (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <RankBadge rank={p.rank} className="size-7 text-[11px]" />
                  </td>
                  <td className="px-3 py-2.5 font-extrabold">{p.discipline}</td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                    {p.level}
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                    {p.venue || '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {formatFullDate(p.recordedAt)}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right font-mono font-bold tabular-nums"
                    style={{ color: style.ring }}
                  >
                    {p.performance || '—'}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2.5">
                      <RowActions podium={p} athleteId={athleteId} onEdit={onEdit} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Filets de vitesse façon flou de mouvement sprint — remplace le motif de
 * rayures statique (correctif 2026-08-25, "plus original que des rayures,
 * moderne et sport"). Chaque trait balaie la carte de gauche à droite en
 * boucle, vitesse/longueur/délai variés pour un rendu organique plutôt que
 * mécanique, teinté sur la médaille en cours (or/argent/bronze).
 */
const SPRINT_LANES = [
  { top: '14%', width: 34, height: 3, duration: 2.6, delay: 0 },
  { top: '27%', width: 22, height: 2, duration: 3.4, delay: 0.6 },
  { top: '41%', width: 44, height: 3, duration: 2.2, delay: 1.1 },
  { top: '58%', width: 26, height: 2, duration: 3.1, delay: 0.3 },
  { top: '71%', width: 38, height: 3, duration: 2.8, delay: 1.6 },
  { top: '85%', width: 20, height: 2, duration: 3.6, delay: 0.9 },
]

function SprintStreaks({ color, isLight }: { color: string; isLight: boolean }) {
  const streakColor = `color-mix(in srgb, ${color} ${isLight ? 55 : 45}%, transparent)`
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPRINT_LANES.map((lane, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: lane.top,
            height: lane.height,
            width: `${lane.width}%`,
            background: `linear-gradient(90deg, transparent, ${streakColor}, transparent)`,
          }}
          initial={{ left: '-40%', opacity: 0 }}
          animate={{ left: '110%', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: lane.duration,
            delay: lane.delay,
            repeat: Infinity,
            repeatDelay: 0.6,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Scène podium à 3 marches, une compétition à la fois par année — repensée en
 * plat (color-mix, pas de dégradé glossy ni de motif diagonal derrière) pour
 * coller au reste de l'appli, mais en gardant l'esprit "podium" (photo de
 * l'athlète sur sa marche, swap par saison) que la grille de cards avait
 * perdu (correctif 2026-08-25, retour demandé par Maksen).
 */
function PodiumSceneView({
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
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              y === year
                ? 'bg-gradient-selected text-white shadow-sm shadow-primary/25'
                : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            <CalendarRange className="size-3.5" />
            {y}
          </button>
        ))}
      </div>

      {yearPodiums.length > 1 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {yearPodiums.map((p, i) => {
            const s = medalStyle(p.rank)
            const active = i === index
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1)
                  setIndex(i)
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                  active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                )}
                style={{
                  background: active ? s.ring : undefined,
                  borderColor: active ? s.ring : 'var(--border)',
                }}
              >
                <RankBadge rank={p.rank} className="size-4 text-[9px]" />
                {p.discipline}
              </button>
            )
          })}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-300"
          style={{
            background: `radial-gradient(120% 70% at 50% 105%, color-mix(in srgb, ${currentStyle.ring} ${isLight ? 48 : 38}%, transparent), transparent 65%)`,
          }}
        />
        <SprintStreaks color={currentStyle.ring} isLight={isLight} />
        <div className="relative mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
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
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            aria-label="Compétition suivante"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

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
            className="relative touch-pan-y"
          >
            <div className="mx-auto flex max-w-md items-end justify-center gap-3 sm:gap-6">
              {STEP_ORDER.map((rank) => {
                const isOurs = rank === current.rank
                const style = medalStyle(rank)
                return (
                  <div key={rank} className="flex flex-1 flex-col items-center">
                    <div className="relative mb-2 flex items-end justify-center">
                      {isOurs ? (
                        <div
                          className="relative size-16 overflow-hidden rounded-full sm:size-20"
                          style={{ boxShadow: `0 0 0 4px ${style.ring}, ${style.glow}` }}
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
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/40 sm:size-20">
                          <UserRound className="size-7" />
                        </div>
                      )}
                      <div
                        className="absolute -bottom-1 left-1/2 z-10 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border-2 text-xs font-black sm:size-8"
                        style={{
                          background: style.disc,
                          borderColor: style.ring,
                          color: style.text,
                        }}
                      >
                        {rank}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border pt-2.5',
                        STEP_HEIGHT[rank]
                      )}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${style.ring} ${isLight ? 22 : 14}%, var(--card))`,
                        borderColor: `color-mix(in srgb, ${style.ring} ${isLight ? 55 : 35}%, transparent)`,
                      }}
                    >
                      <span className="text-sm font-black" style={{ color: style.ring }}>
                        {rankOrdinal(rank)}
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

        <div className="relative mt-4 flex items-center justify-center gap-2">
          <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {index + 1} / {yearPodiums.length}
          </span>
          {canEdit && <RowActions podium={current} athleteId={athleteId} onEdit={onEdit} />}
        </div>
      </div>
    </div>
  )
}
