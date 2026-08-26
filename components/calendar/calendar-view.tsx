'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  MapPin,
  Plus,
  Settings,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  buildMonthGrid,
  monthLabel,
  sameDay,
  addMonths,
  toDateInputValue,
} from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'
import {
  SessionFormDialog,
  type TrainingTypeOption,
  type CoachOption,
} from '@/components/calendar/session-form-dialog'
import { type ColorTypeOption } from '@/components/calendar/type-pill-picker'

type CalSession = {
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  description: string | null
  trainingType: { id: string; name: string; color: string } | null
  coach: { id: string; firstName: string } | null
  coachPresent: boolean
}

type CalCompetition = {
  id: string
  title: string
  date: Date
  location: string | null
  competitionTypeId: string | null
  competitionType: { id: string; name: string; color: string } | null
  description: string | null
  registrationCount: number
  ffaRegisteredCount: number
  isRegistered: boolean
}

type Tab = 'sessions' | 'competitions'

type DragItem = { id: string; title: string; color: string; kind: Tab }

export function CalendarView({
  year,
  month,
  sessions,
  competitions,
  trainingTypes,
  competitionTypes,
  coaches,
  currentUserId,
  canManageSessions,
  canManageCompetitions,
}: {
  year: number
  month: number
  sessions: CalSession[]
  competitions: CalCompetition[]
  trainingTypes: TrainingTypeOption[]
  competitionTypes: ColorTypeOption[]
  coaches: CoachOption[]
  currentUserId?: string
  canManageSessions: boolean
  canManageCompetitions: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('sessions')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const [draggingItem, setDraggingItem] = useState<DragItem | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const dragStateRef = useRef<{
    startX: number
    startY: number
    pointerId: number | null
    pointerType: string
    armed: boolean
    item: DragItem | null
    longPressTimer: ReturnType<typeof setTimeout> | null
  }>({
    startX: 0,
    startY: 0,
    pointerId: null,
    pointerType: 'mouse',
    armed: false,
    item: null,
    longPressTimer: null,
  })
  const suppressClickRef = useRef(false)

  const [hoverItem, setHoverItem] = useState<{ kind: Tab; id: string } | null>(null)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = new Date()
  const canManageActiveTab = tab === 'sessions' ? canManageSessions : canManageCompetitions

  async function moveItem(kind: Tab, id: string, newDate: string) {
    const url = kind === 'sessions' ? `/api/sessions/${id}` : `/api/competitions/${id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate }),
    })
    if (res.ok) {
      toast.success(kind === 'sessions' ? 'Séance déplacée.' : 'Compétition déplacée.')
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      console.error('Échec du déplacement', kind, res.status, body)
      toast.error(
        kind === 'sessions'
          ? 'Impossible de déplacer la séance.'
          : 'Impossible de déplacer la compétition.'
      )
    }
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const st = dragStateRef.current
      if (st.pointerId === null || e.pointerId !== st.pointerId) return
      const dx = e.clientX - st.startX
      const dy = e.clientY - st.startY
      const moved = Math.hypot(dx, dy)
      if (!st.armed) {
        if (st.pointerType === 'mouse') {
          if (moved > 4) {
            st.armed = true
            suppressClickRef.current = true
            setDraggingItem(st.item)
            setDragPos({ x: e.clientX, y: e.clientY })
          }
          return
        }
        if (moved > 10) {
          if (st.longPressTimer) clearTimeout(st.longPressTimer)
          st.pointerId = null
        }
        return
      }
      setDragPos({ x: e.clientX, y: e.clientY })
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cell = el?.closest<HTMLElement>('[data-cell-date]')
      setDragOverDate(cell?.dataset.cellDate ?? null)
    }

    function onUp(e: PointerEvent) {
      const st = dragStateRef.current
      if (st.pointerId === null || e.pointerId !== st.pointerId) return
      if (st.longPressTimer) clearTimeout(st.longPressTimer)
      if (st.armed && st.item) {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const cell = el?.closest<HTMLElement>('[data-cell-date]')
        const newDate = cell?.dataset.cellDate
        if (newDate) moveItem(st.item.kind, st.item.id, newDate)
        setTimeout(() => {
          suppressClickRef.current = false
        }, 50)
      }
      st.pointerId = null
      st.armed = false
      st.item = null
      setDraggingItem(null)
      setDragPos(null)
      setDragOverDate(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePillPointerDown(e: ReactPointerEvent, item: DragItem) {
    const allowed = item.kind === 'sessions' ? canManageSessions : canManageCompetitions
    if (!allowed) return
    e.stopPropagation()
    const st = dragStateRef.current
    st.startX = e.clientX
    st.startY = e.clientY
    st.pointerId = e.pointerId
    st.pointerType = e.pointerType
    st.item = item
    st.armed = false

    if (e.pointerType === 'mouse') return

    if (st.longPressTimer) clearTimeout(st.longPressTimer)
    st.longPressTimer = setTimeout(() => {
      st.armed = true
      suppressClickRef.current = true
      setDraggingItem(item)
      setDragPos({ x: e.clientX, y: e.clientY })
      if (navigator.vibrate) navigator.vibrate(10)
    }, 280)
  }

  function go(delta: number) {
    const { year: y, month: m } = addMonths(year, month, delta)
    router.push(`/calendar?year=${y}&month=${m}`)
  }

  function goToday() {
    const now = new Date()
    router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
  }

  function goToNewCompetition() {
    const date = selectedDay ?? today
    router.push(`/competitions/new?date=${toDateInputValue(date)}`)
  }

  const daySessions = selectedDay ? sessions.filter((s) => sameDay(s.date, selectedDay)) : []
  const dayCompetitions = selectedDay
    ? competitions.filter((c) => sameDay(c.date, selectedDay))
    : []

  return (
    <div className="space-y-5">
      {/* Mois + création (mobile) */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => go(-1)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-full px-2 py-1 text-sm font-semibold capitalize transition-colors hover:bg-muted"
          >
            {monthLabel(year, month)}
          </button>
          <button
            onClick={() => go(1)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {canManageActiveTab && (
          <button
            onClick={() => (tab === 'sessions' ? setCreateOpen(true) : goToNewCompetition())}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        )}
      </div>

      {/* Onglets (mobile) */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm sm:hidden">
        {(['sessions', 'competitions'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === value
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === value && (
              <motion.span
                layoutId="calendar-tab-mobile"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            )}
            {value === 'sessions' ? <Zap className="size-3.5" /> : <Trophy className="size-3.5" />}
            {value === 'sessions' ? 'Entraînements' : 'Compétitions'}
          </button>
        ))}
      </div>

      {/* Tabs + légende (desktop, vue classique) — grid à 3 colonnes fixes plutôt que
          flex+justify-between : avec justify-between, la pastille du mois (2e enfant)
          se retrouvait plaquée à droite dès que le bouton "+ Nouvelle..." (3e enfant,
          conditionnel selon le rôle) disparaissait, faute d'un 3e enfant pour la
          répartition. La colonne centrale reste fixe que le bouton existe ou non. */}
      <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-3 sm:grid">
        <div className="inline-flex justify-self-start rounded-full border border-border bg-card p-0.5 shadow-sm">
          {(['sessions', 'competitions'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === value
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === value && (
                <motion.span
                  layoutId="calendar-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              )}
              {value === 'sessions' ? (
                <Zap className="size-3.5" />
              ) : (
                <Trophy className="size-3.5" />
              )}
              {value === 'sessions' ? 'Entraînements' : 'Compétitions'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-self-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => go(-1)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-full px-2.5 py-1 text-sm font-semibold capitalize transition-colors hover:bg-muted"
          >
            {monthLabel(year, month)}
          </button>
          <button
            onClick={() => go(1)}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {canManageActiveTab && (
          <button
            onClick={() => (tab === 'sessions' ? setCreateOpen(true) : goToNewCompetition())}
            className="group inline-flex items-center justify-self-end gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            {tab === 'sessions' ? 'Nouvelle séance' : 'Nouvelle compétition'}
          </button>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-2">
        {(tab === 'sessions' ? trainingTypes : competitionTypes).map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${t.color}22`, color: t.color, borderColor: `${t.color}44` }}
          >
            <span className="size-1.5 rounded-full" style={{ background: t.color }} />
            {t.name}
          </span>
        ))}
        {canManageActiveTab && (
          <Link
            href={tab === 'sessions' ? '/settings?tab=sessions' : '/settings?tab=competitions'}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Settings className="size-3" />
            Gérer
          </Link>
        )}
      </div>

      {/* Grille du mois */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b border-border text-center text-[11px] font-bold text-muted-foreground uppercase">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const isToday = sameDay(cell.date, today)
            const cellDateKey = toDateInputValue(cell.date)
            const items =
              tab === 'sessions'
                ? sessions.filter((s) => sameDay(s.date, cell.date))
                : competitions.filter((c) => sameDay(c.date, cell.date))
            const visiblePills = items.slice(0, 3)
            const overflowPills = items.length - visiblePills.length
            const visibleDots = items.slice(0, 4)
            const overflowDots = items.length - visibleDots.length
            const isDropTarget = canManageActiveTab && dragOverDate === cellDateKey

            return (
              <button
                key={cell.date.toISOString()}
                data-cell-date={cellDateKey}
                onClick={(e) => {
                  if (suppressClickRef.current) {
                    e.preventDefault()
                    return
                  }
                  if (items.length === 1) {
                    router.push(
                      tab === 'sessions'
                        ? `/sessions/${items[0].id}`
                        : `/competitions/${items[0].id}`
                    )
                    return
                  }
                  setSelectedDay(cell.date)
                }}
                className={cn(
                  'flex h-20 flex-col gap-0.5 overflow-hidden border-r border-b border-border p-1 text-left transition-colors last:border-r-0 hover:bg-muted/40 sm:h-auto sm:min-h-24 sm:gap-1 sm:p-1.5',
                  !cell.inMonth && 'bg-muted/20 text-muted-foreground/50',
                  isDropTarget && 'bg-primary/10 ring-2 ring-inset ring-primary/50'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:size-6 sm:text-xs',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {cell.day}
                </span>
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {/* Mobile + tablette : pas assez de place pour un libellé lisible,
                      on affiche juste des pastilles colorées (le tap sur le jour
                      ouvre la liste complète, cf. modal du jour). */}
                  <div className="flex flex-wrap items-center gap-1 xl:hidden">
                    {visibleDots.map((item) => {
                      const color =
                        tab === 'sessions'
                          ? (item as CalSession).trainingType?.color
                          : (item as CalCompetition).competitionType?.color
                      const isBeingDragged =
                        draggingItem?.id === item.id && draggingItem.kind === tab
                      return (
                        <span
                          key={item.id}
                          onPointerDown={(e) =>
                            handlePillPointerDown(e, {
                              id: item.id,
                              title: item.title,
                              color: color ?? '#94a3b8',
                              kind: tab,
                            })
                          }
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            canManageActiveTab && 'touch-none select-none',
                            isBeingDragged && 'opacity-30'
                          )}
                          style={{ background: color ?? '#94a3b8' }}
                        />
                      )
                    })}
                    {overflowDots > 0 && (
                      <span className="text-[9px] leading-none font-semibold text-muted-foreground">
                        +{overflowDots}
                      </span>
                    )}
                  </div>

                  {/* Desktop large : assez de place pour un libellé tronqué. */}
                  <div className="hidden flex-1 flex-col gap-1 overflow-hidden xl:flex">
                    {visiblePills.map((item) => {
                      const color =
                        tab === 'sessions'
                          ? (item as CalSession).trainingType?.color
                          : (item as CalCompetition).competitionType?.color
                      const isBeingDragged =
                        draggingItem?.id === item.id && draggingItem.kind === tab
                      return (
                        <span
                          key={item.id}
                          onPointerDown={(e) =>
                            handlePillPointerDown(e, {
                              id: item.id,
                              title: item.title,
                              color: color ?? '#94a3b8',
                              kind: tab,
                            })
                          }
                          onMouseEnter={(e) => {
                            setHoverItem({ kind: tab, id: item.id })
                            setHoverRect(e.currentTarget.getBoundingClientRect())
                          }}
                          onMouseLeave={() => setHoverItem(null)}
                          className={cn(
                            'flex shrink-0 items-center gap-0.5 truncate rounded px-1.5 py-0.5 text-[10px] font-semibold',
                            canManageActiveTab && 'touch-none select-none',
                            isBeingDragged && 'opacity-30'
                          )}
                          style={{
                            backgroundColor: `${color ?? '#94a3b8'}22`,
                            color: color ?? '#64748b',
                          }}
                        >
                          {canManageActiveTab && (
                            <GripVertical className="size-2.5 shrink-0 opacity-60" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </span>
                      )
                    })}
                    {overflowPills > 0 && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        +{overflowPills}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Ghost flottant pendant le drag */}
      {draggingItem && dragPos && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-1 rounded-lg bg-card px-3 py-2 text-xs font-semibold shadow-xl ring-1 ring-border"
          style={{ left: dragPos.x, top: dragPos.y, transform: 'translate(-50%, -120%)' }}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: draggingItem.color }}
          />
          {draggingItem.title}
        </div>
      )}

      {/* Aperçu au survol (souris uniquement) */}
      {hoverItem && hoverRect && !draggingItem && (
        <HoverPreview
          hoverItem={hoverItem}
          rect={hoverRect}
          sessions={sessions}
          competitions={competitions}
        />
      )}

      {/* Modal du jour */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedDay?.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {tab === 'sessions' ? (
                daySessions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aucune séance ce jour.
                  </p>
                ) : (
                  daySessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: s.trainingType?.color ?? '#94a3b8' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        {s.trainingType && (
                          <div className="text-xs text-muted-foreground">{s.trainingType.name}</div>
                        )}
                      </div>
                      {s.durationMinutes && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.durationMinutes} min
                        </span>
                      )}
                    </Link>
                  ))
                )
              ) : dayCompetitions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune compétition ce jour.
                </p>
              ) : (
                dayCompetitions.map((c) => (
                  <Link
                    key={c.id}
                    href={`/competitions/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: c.competitionType?.color ?? '#94a3b8' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.competitionType?.name}
                        {c.location ? ` · ${c.location}` : ''}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {c.registrationCount}
                    </span>
                  </Link>
                ))
              )}
            </AnimatePresence>

            {tab === 'sessions' && canManageSessions && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Plus className="size-4" />
                Ajouter une séance ce jour
              </button>
            )}
            {tab === 'competitions' && canManageCompetitions && (
              <button
                onClick={goToNewCompetition}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Plus className="size-4" />
                Ajouter une compétition ce jour
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SessionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        date={selectedDay ?? today}
        trainingTypes={trainingTypes}
        coaches={coaches}
        currentUserId={currentUserId}
        onSuccess={() => setSelectedDay(null)}
      />
    </div>
  )
}

function HoverPreview({
  hoverItem,
  rect,
  sessions,
  competitions,
}: {
  hoverItem: { kind: Tab; id: string }
  rect: DOMRect
  sessions: CalSession[]
  competitions: CalCompetition[]
}) {
  const width = 280
  const GAP = 10

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768

  const spaceBelow = viewportH - rect.bottom
  const spaceAbove = rect.top
  const placeAbove = spaceBelow < 170 && spaceAbove > spaceBelow

  let left = rect.left + rect.width / 2 - width / 2
  left = Math.min(Math.max(left, 8), viewportW - width - 8)

  const positionStyle: React.CSSProperties = placeAbove
    ? { left, bottom: viewportH - rect.top + GAP, width }
    : { left, top: rect.bottom + GAP, width }

  if (hoverItem.kind === 'sessions') {
    const session = sessions.find((s) => s.id === hoverItem.id)
    if (!session) return null
    const color = session.trainingType?.color ?? '#94a3b8'
    return (
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-border bg-card text-xs shadow-xl"
        style={{ ...positionStyle, position: 'fixed' }}
      >
        <div className="h-1.5" style={{ background: color }} />
        <div className="p-3">
          {session.trainingType && (
            <span
              className="mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {session.trainingType.name}
            </span>
          )}
          <div className="truncate text-sm font-bold">{session.title}</div>
          {session.durationMinutes && (
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              {session.durationMinutes} min
            </div>
          )}
          {session.coach && (
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  session.coachPresent ? 'bg-emerald-500' : 'bg-rose-500'
                )}
              />
              {session.coach.firstName}
            </div>
          )}
          <p className="mt-2 line-clamp-3 text-muted-foreground italic">
            {session.description || 'Aucun programme renseigné.'}
          </p>
          <div className="mt-2 flex items-center gap-1 border-t border-border pt-2 text-[11px] font-semibold text-primary">
            Cliquer pour voir la fiche
            <ArrowRight className="size-3" />
          </div>
        </div>
      </div>
    )
  }

  const competition = competitions.find((c) => c.id === hoverItem.id)
  if (!competition) return null
  const color = competition.competitionType?.color ?? '#94a3b8'
  return (
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-border bg-card text-xs shadow-xl"
      style={{ ...positionStyle, position: 'fixed' }}
    >
      <div className="h-1.5" style={{ background: color }} />
      <div className="p-3">
        {competition.competitionType && (
          <span
            className="mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {competition.competitionType.name}
          </span>
        )}
        <div className="truncate text-sm font-bold">{competition.title}</div>
        <div className="mt-1.5 space-y-1 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="size-3 shrink-0" />
            {competition.registrationCount} inscrit{competition.registrationCount > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Check className="size-3 shrink-0" />
            {competition.ffaRegisteredCount} inscrit{competition.ffaRegisteredCount > 1 ? 's' : ''}{' '}
            FFA
          </div>
          {competition.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 shrink-0" />
              {competition.location}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 border-t border-border pt-2 text-[11px] font-semibold text-primary">
          Cliquer pour voir la fiche
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  )
}
