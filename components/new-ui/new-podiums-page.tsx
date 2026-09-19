'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Medal, List, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { fullName } from '@/lib/athlete'
import { formatFullDate } from '@/lib/date'
import { computeSeason } from '@/lib/performance'
import { MEDAL_GRADIENTS } from '@/components/athletes/podiums/medal-colors'
import { MedalIcon } from '@/components/athletes/podiums/medal-icon'
import type { PodiumItem, AthleteInfo } from '@/components/athletes/podiums/podiums-view'
import { PodiumFormDialog } from '@/components/athletes/podiums/podium-form-dialog'
import { NewPodiumStage } from '@/components/new-ui/new-podium-stage'
import { SeasonSelect } from '@/components/athletes/season-select'

type ViewMode = 'grid' | 'list'

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nu-tool inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors"
      style={{
        border: `1px solid ${active ? 'transparent' : 'var(--nu-line)'}`,
        color: active ? '#fff' : 'var(--nu-dim)',
        background: active ? 'var(--nu-acc)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function NewPodiumList({
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
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce podium ?')) return
    const res = await fetch(`/api/athletes/${athleteId}/podiums/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Suppression impossible.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2.5">
      {podiums.map((p, i) => {
        const s = MEDAL_GRADIENTS[(p.rank in MEDAL_GRADIENTS ? p.rank : 3) as 1 | 2 | 3]
        return (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{
              duration: 0.35,
              ease: [0.2, 0.9, 0.25, 1],
              delay: Math.min(i, 10) * 0.05,
            }}
            className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-[16px] px-5 py-3.5"
            style={{
              background: 'var(--nu-surf)',
              border: '1px solid var(--nu-line)',
              boxShadow: 'inset 0 1px 0 var(--nu-rim)',
            }}
          >
            <MedalIcon rank={p.rank} size={32} />
            <div className="min-w-0">
              <h4 className="truncate text-[15px] font-bold" style={{ color: 'var(--nu-txt)' }}>
                {p.discipline}
              </h4>
              <div className="mt-1 truncate text-[12.5px]" style={{ color: 'var(--nu-dim)' }}>
                {p.level} · {formatFullDate(p.recordedAt)}
                {p.venue ? ` · ${p.venue}` : ''}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {p.performance && (
                <span className="nu-num text-[18px] font-bold" style={{ color: s.ring }}>
                  {p.performance}
                </span>
              )}
              {canEdit && p.source === 'manual' && (
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="nu-tool flex size-7 items-center justify-center rounded-full transition-colors"
                    style={{ color: 'var(--nu-dim)' }}
                    aria-label="Modifier"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="flex size-7 items-center justify-center rounded-full transition-colors hover:[background:color-mix(in_srgb,var(--nu-ko)_15%,transparent)] hover:[color:var(--nu-ko)]"
                    style={{ color: 'var(--nu-dim)' }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}

export function NewPodiumsPage({
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
  const [mode, setMode] = useState<ViewMode>('grid')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PodiumItem | null>(null)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  // Filtres saison + discipline (retour Maksen 2026-09-20 : "comme sur le
  // profil ou stats avancés") — narrows aussi bien la scène podium que la
  // vue liste, et les compteurs Or/Argent/Bronze au-dessus (utile pour voir
  // le bilan d'une saison ou d'une discipline précise, pas juste filtrer
  // l'affichage).
  const [seasonFilter, setSeasonFilter] = useState<'all' | number>('all')
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | string>('all')

  const seasons = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of podiums) {
      const { seasonStart, seasonShort } = computeSeason(p.recordedAt)
      map.set(seasonStart, seasonShort)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([seasonStart, label]) => ({ seasonStart, label }))
  }, [podiums])

  const disciplines = useMemo(
    () => Array.from(new Set(podiums.map((p) => p.discipline))).sort((a, b) => a.localeCompare(b)),
    [podiums]
  )

  // Plus récent en premier, comme le reste de l'app (listes de perfs/séances).
  const sorted = useMemo(
    () =>
      podiums
        .filter(
          (p) => seasonFilter === 'all' || computeSeason(p.recordedAt).seasonStart === seasonFilter
        )
        .filter((p) => disciplineFilter === 'all' || p.discipline === disciplineFilter)
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [podiums, seasonFilter, disciplineFilter]
  )
  useEffect(() => setIndex((i) => Math.min(i, Math.max(0, sorted.length - 1))), [sorted.length])
  const current = sorted[index]

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 }
    for (const p of sorted) {
      if (p.rank === 1 || p.rank === 2 || p.rank === 3) c[p.rank]++
    }
    return c
  }, [sorted])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(p: PodiumItem) {
    setEditing(p)
    setFormOpen(true)
  }
  function navigate(i: number, dir: number) {
    setDirection(dir)
    setIndex(i)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-[clamp(26px,2.9vw,36px)] leading-[1.04] font-extrabold tracking-[-0.02em]"
            style={{ color: 'var(--nu-txt)' }}
          >
            Podiums
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ color: 'var(--nu-dim)' }}>
            {fullName(athlete.firstName, athlete.lastName)} · {podiums.length} podium
            {podiums.length > 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && podiums.length > 0 && (
          <button
            type="button"
            onClick={openAdd}
            className="nu-sheen inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
          >
            <Plus className="size-4" />
            Ajouter un podium
          </button>
        )}
      </div>

      {podiums.length === 0 ? (
        <div
          className="rounded-[20px] py-16 text-center"
          style={{ border: '1px dashed var(--nu-line)', background: 'var(--nu-surf)' }}
        >
          <Trophy
            className="mx-auto mb-3 size-9"
            style={{ color: 'var(--nu-dim)', opacity: 0.5 }}
          />
          <p className="mb-1 text-lg font-extrabold" style={{ color: 'var(--nu-txt)' }}>
            Aucun podium pour le moment
          </p>
          <p className="mb-5 text-sm" style={{ color: 'var(--nu-dim)' }}>
            Synchronise avec athle.fr ou ajoute-en un manuellement.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={openAdd}
              className="nu-sheen inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
            >
              <Plus className="size-4" />
              Ajouter un podium
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 grid grid-cols-3 gap-3.5">
            {([1, 2, 3] as const).map((rank, i) => {
              const style = MEDAL_GRADIENTS[rank]
              return (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.2, 0.9, 0.25, 1], delay: i * 0.09 }}
                  className="relative flex items-center gap-2.5 rounded-[20px] p-3 sm:gap-4 sm:p-5"
                  style={{
                    background: 'var(--nu-surf)',
                    border: '1px solid var(--nu-line)',
                    boxShadow: 'inset 0 1px 0 var(--nu-rim)',
                  }}
                >
                  <MedalIcon rank={rank} size={32} className="shrink-0 sm:hidden" />
                  <MedalIcon rank={rank} size={44} className="hidden shrink-0 sm:block" />
                  <div className="relative min-w-0">
                    <div
                      className="nu-num text-[24px] leading-[0.9] sm:text-[36px]"
                      style={{ color: style.ring }}
                    >
                      {counts[rank]}
                    </div>
                    <div
                      className="mt-1.5 truncate text-[8.5px] font-semibold tracking-[0.08em] uppercase sm:text-[10px] sm:tracking-[0.16em]"
                      style={{ color: 'var(--nu-dim)' }}
                    >
                      {style.label}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Filtres saison + discipline — dropdown à taille fixe sur mobile,
              rangée de pills sur desktop, même traitement que l'onglet
              Performances/Stats avancées (retour Maksen 2026-09-20). Affectent
              aussi bien la scène podium que la vue liste ci-dessous, et les
              compteurs Or/Argent/Bronze au-dessus. */}
          {(seasons.length > 1 || disciplines.length > 1) && (
            <div className="mb-4 space-y-2.5">
              <div className="flex flex-col gap-2.5 sm:hidden">
                {seasons.length > 1 && (
                  <SeasonSelect
                    value={seasonFilter === 'all' ? 'all' : String(seasonFilter)}
                    onChange={(v) => setSeasonFilter(v === 'all' ? 'all' : Number(v))}
                    allLabel="Toutes"
                    options={seasons.map((s) => ({ value: String(s.seasonStart), label: s.label }))}
                  />
                )}
                {disciplines.length > 1 && (
                  <SeasonSelect
                    value={disciplineFilter}
                    onChange={setDisciplineFilter}
                    allLabel="Toutes"
                    icon={Medal}
                    options={disciplines.map((d) => ({ value: d, label: d }))}
                  />
                )}
              </div>
              <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                {seasons.length > 1 && (
                  <>
                    <FilterPill
                      active={seasonFilter === 'all'}
                      onClick={() => setSeasonFilter('all')}
                    >
                      Toutes saisons
                    </FilterPill>
                    {seasons.map((s) => (
                      <FilterPill
                        key={s.seasonStart}
                        active={seasonFilter === s.seasonStart}
                        onClick={() => setSeasonFilter(s.seasonStart)}
                      >
                        {s.label}
                      </FilterPill>
                    ))}
                  </>
                )}
                {seasons.length > 1 && disciplines.length > 1 && (
                  <span className="mx-1 h-4 w-px" style={{ background: 'var(--nu-line)' }} />
                )}
                {disciplines.length > 1 && (
                  <>
                    <FilterPill
                      active={disciplineFilter === 'all'}
                      onClick={() => setDisciplineFilter('all')}
                    >
                      Toutes disciplines
                    </FilterPill>
                    {disciplines.map((d) => (
                      <FilterPill
                        key={d}
                        active={disciplineFilter === d}
                        onClick={() => setDisciplineFilter(d)}
                      >
                        {d}
                      </FilterPill>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div
              className="relative inline-flex shrink-0 items-center gap-0.5 rounded-[13px] p-0.5"
              style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
            >
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
                  className="relative z-10 inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                  style={{ color: mode === opt.key ? '#fff' : 'var(--nu-dim)' }}
                >
                  {mode === opt.key && (
                    <motion.span
                      layoutId="new-podiums-view-mode"
                      className="absolute inset-0 -z-10 rounded-[10px]"
                      style={{ background: 'var(--nu-acc)' }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    />
                  )}
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Puces événement — une par podium, sur la même ligne que le
                switcher (façon mockup `.pd-tools`), visibles uniquement en
                vue "Podiums" (le mockup les masque en liste). */}
            {mode === 'grid' && sorted.length > 1 && (
              <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-[7px] overflow-x-auto">
                {sorted.map((p, i) => {
                  const active = i === index
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(i, i > index ? 1 : -1)}
                      className="nu-tool inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] whitespace-nowrap transition-colors"
                      style={{
                        border: `1px solid ${active ? 'transparent' : 'var(--nu-line)'}`,
                        color: active ? 'var(--nu-txt)' : 'var(--nu-dim)',
                        background: active ? 'var(--nu-surf2)' : 'transparent',
                        boxShadow: active
                          ? `inset 0 0 0 1px color-mix(in srgb, var(--nu-acc) 40%, transparent)`
                          : undefined,
                      }}
                    >
                      <MedalIcon rank={p.rank} size={18} />
                      {p.discipline}
                    </button>
                  )
                })}
              </div>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={openAdd}
                className="nu-tool inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-colors"
                style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
              >
                <Plus className="size-4" />
                Ajouter
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div
              className="rounded-[20px] py-14 text-center"
              style={{ border: '1px dashed var(--nu-line)', background: 'var(--nu-surf)' }}
            >
              <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
                Aucun podium pour ces filtres.
              </p>
            </div>
          ) : mode === 'list' ? (
            <NewPodiumList
              podiums={sorted}
              athleteId={athleteId}
              canEdit={canEdit}
              onEdit={openEdit}
            />
          ) : (
            current && (
              <NewPodiumStage
                podiums={sorted}
                athlete={athlete}
                athleteId={athleteId}
                canEdit={canEdit}
                index={index}
                direction={direction}
                onNavigate={navigate}
                onEdit={openEdit}
              />
            )
          )}
        </div>
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
