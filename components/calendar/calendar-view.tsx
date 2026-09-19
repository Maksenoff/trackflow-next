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
  Dumbbell,
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
  buildWeekGrid,
  monthLabel,
  weekLabel,
  sameDay,
  addMonths,
  addDays,
  toDateInputValue,
} from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'
import { fullName } from '@/lib/athlete'
import { formatTime } from '@/lib/date'
import { CUSTOM_SESSION_COLOR } from '@/lib/custom-session'
import { legibleAccent } from '@/lib/color-contrast'
import {
  SessionFormDialog,
  type TrainingTypeOption,
  type CoachOption,
} from '@/components/calendar/session-form-dialog'
import { CustomSessionFormDialog } from '@/components/calendar/custom-session-form-dialog'
import { type ColorTypeOption } from '@/components/calendar/type-pill-picker'
import { MobileWeekCarousel } from '@/components/calendar/mobile-week-carousel'
import {
  weatherIcon,
  forecastAt,
  DEFAULT_TRAINING_HOUR,
  type WeeklyHourlyWeather,
} from '@/lib/weather'
import { WeatherPopover } from '@/components/calendar/weather-popover'
import { BirthdayBadge, type CalBirthday } from '@/components/calendar/birthday-badge'

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

/** Séance perso athlète — le champ `athlete` la distingue à l'exécution des
 * CalSession/CalCompetition (aucun des deux ne l'a) sans discriminant dédié. */
type CalCustomSession = {
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  description: string | null
  difficulty: number | null
  skipped: boolean
  athlete: { id: string; firstName: string; lastName: string }
}

type Tab = 'sessions' | 'competitions'

type DragItem = {
  id: string
  title: string
  color: string
  kind: Tab | 'custom'
  /** Uniquement pour kind: 'custom' — vérifie que le glisser vient bien du
   * propriétaire de la séance perso avant de l'autoriser. */
  athleteId?: string
}

type CalendarViewMode = 'month' | 'week'

export function CalendarView({
  year,
  month,
  sessions,
  competitions,
  customSessions,
  trainingTypes,
  competitionTypes,
  coaches,
  currentUserId,
  linkedAthleteId,
  canManageSessions,
  canManageCompetitions,
  showAllCustom,
  initialView = 'week',
  initialWeekAnchor,
  weather,
  birthdays,
}: {
  year: number
  month: number
  sessions: CalSession[]
  competitions: CalCompetition[]
  customSessions: CalCustomSession[]
  trainingTypes: TrainingTypeOption[]
  competitionTypes: ColorTypeOption[]
  coaches: CoachOption[]
  currentUserId?: string
  /** Profil athlète lié au compte connecté — conditionne "+ Ajouter une séance
   * personnelle" (un coach sans profil lié n'en a pas). */
  linkedAthleteId?: string | null
  canManageSessions: boolean
  canManageCompetitions: boolean
  /** Filtre "calendrier général" (coach) : `customSessions` contient alors
   * celles de tout le club plutôt que les siennes uniquement (cf. page.tsx). */
  showAllCustom: boolean
  /** Mois ou semaine — la vue semaine réutilise les mêmes données (chargées
   * avec une marge de 6j de chaque côté du mois, cf. lib/calendar-data.ts) et
   * ne redemande au serveur qu'en cas de navigation vers une semaine hors de
   * cette marge (cf. goWeek). */
  initialView?: CalendarViewMode
  /** Date (YYYY-MM-DD) de la semaine à afficher au chargement, en vue semaine. */
  initialWeekAnchor?: string | null
  /** Prévisions météo heure par heure du club (Marquette-lez-Lille), cf.
   * lib/weather.ts — pictogramme du carrousel semaine mobile, et pastille
   * discrète dans les cellules de la grille mois + semaine desktop,
   * uniquement les jours où une séance est placée, à l'heure de cette
   * séance (retour Maksen 2026-09-18). */
  weather?: WeeklyHourlyWeather
  /** Anniversaires du mois affiché (+ marge, cf. lib/calendar-data.ts) — petit
   * badge gâteau discret sur la case du jour, mois comme semaine, mobile
   * comme desktop (retour Maksen 2026-09-19). */
  birthdays?: CalBirthday[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('sessions')
  const [view, setViewState] = useState<CalendarViewMode>(initialView)
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => {
    if (initialWeekAnchor) {
      const [y, m, d] = initialWeekAnchor.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() + 1 === month
      ? now
      : new Date(year, month - 1, 1)
  })
  // `useState(initialWeekAnchor)`/`useState(initialView)` ne (re)lisent leur
  // valeur initiale qu'au montage — après un `router.push` vers une autre
  // semaine/vue, ce composant client n'est pas remonté (même route), donc ces
  // props changent mais l'état local resterait périmé sans cette synchro.
  useEffect(() => setViewState(initialView), [initialView])
  useEffect(() => {
    if (!initialWeekAnchor) return
    const [y, m, d] = initialWeekAnchor.split('-').map(Number)
    setWeekAnchor(new Date(y, m - 1, d))
  }, [initialWeekAnchor])

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [customFormOpen, setCustomFormOpen] = useState(false)
  // Date de création "rapide" depuis le carrousel semaine mobile, cf.
  // quickCreateSession/quickCreateCustomSession plus bas — indépendante de
  // `selectedDay` pour ne pas ouvrir le modal du jour en même temps.
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null)

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

  const [hoverItem, setHoverItem] = useState<{ kind: Tab | 'custom'; id: string } | null>(null)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)

  const cells = useMemo(
    () => (view === 'week' ? buildWeekGrid(weekAnchor) : buildMonthGrid(year, month)),
    [view, weekAnchor, year, month]
  )
  const today = new Date()
  const canManageActiveTab = tab === 'sessions' ? canManageSessions : canManageCompetitions

  const birthdaysByDate = useMemo(() => {
    const map = new Map<string, CalBirthday[]>()
    for (const b of birthdays ?? []) {
      const key = toDateInputValue(b.date)
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [birthdays])

  async function moveItem(kind: Tab | 'custom', id: string, newDate: string) {
    const url =
      kind === 'sessions'
        ? `/api/sessions/${id}`
        : kind === 'competitions'
          ? `/api/competitions/${id}`
          : `/api/athletes/${linkedAthleteId}/custom-sessions/${id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate }),
    })
    if (res.ok) {
      toast.success(
        kind === 'sessions'
          ? 'Séance déplacée.'
          : kind === 'competitions'
            ? 'Compétition déplacée.'
            : 'Séance personnelle déplacée.'
      )
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      console.error('Échec du déplacement', kind, res.status, body)
      toast.error(
        kind === 'sessions'
          ? 'Impossible de déplacer la séance.'
          : kind === 'competitions'
            ? 'Impossible de déplacer la compétition.'
            : 'Impossible de déplacer la séance personnelle.'
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
    const allowed =
      item.kind === 'sessions'
        ? canManageSessions
        : item.kind === 'competitions'
          ? canManageCompetitions
          : !!linkedAthleteId && item.athleteId === linkedAthleteId
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

  function calendarUrl(
    y: number,
    m: number,
    showAll: boolean,
    v: CalendarViewMode = view,
    weekAnchorDate?: Date
  ) {
    const params = new URLSearchParams({ year: String(y), month: String(m) })
    if (showAll) params.set('showAllCustom', '1')
    if (v === 'week') {
      params.set('view', 'week')
      params.set('week', toDateInputValue(weekAnchorDate ?? weekAnchor))
    }
    return `/calendar?${params.toString()}`
  }

  function go(delta: number) {
    const { year: y, month: m } = addMonths(year, month, delta)
    router.push(calendarUrl(y, m, showAllCustom, 'month'))
  }

  /** Navigue toujours vers le serveur (comme `go`) plutôt que de ne bouger que
   * l'état local `weekAnchor` : la marge de `monthRange` (±6j, cf.
   * lib/calendar-data.ts) ne couvre qu'une semaine de battement, pas une
   * pagination libre — rester correct à coup sûr, quel que soit le nombre de
   * semaines parcourues, prime sur épargner un aller-retour serveur. */
  function goWeek(delta: number) {
    const newAnchor = addDays(weekAnchor, delta * 7)
    router.push(
      calendarUrl(
        newAnchor.getFullYear(),
        newAnchor.getMonth() + 1,
        showAllCustom,
        'week',
        newAnchor
      )
    )
  }

  function goToday() {
    const now = new Date()
    router.push(calendarUrl(now.getFullYear(), now.getMonth() + 1, showAllCustom, view, now))
  }

  function switchView(next: CalendarViewMode) {
    if (next === view) return
    setViewState(next)
    router.push(calendarUrl(year, month, showAllCustom, next, weekAnchor))
    // Mémorisée par profil (retour Maksen 2026-09-18) — fire-and-forget, un
    // échec réseau ne doit pas bloquer le changement de vue lui-même, déjà
    // appliqué localement/dans l'URL juste au-dessus.
    fetch('/api/users/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarView: next }),
    }).catch(() => {})
  }

  function toggleShowAllCustom(checked: boolean) {
    router.push(calendarUrl(year, month, checked))
  }

  function goToNewCompetition() {
    const date = selectedDay ?? today
    router.push(`/competitions/new?date=${toDateInputValue(date)}`)
  }

  function openCreateCustom() {
    setCustomFormOpen(true)
  }

  function quickCreateCompetition(date: Date) {
    router.push(`/competitions/new?date=${toDateInputValue(date)}`)
  }

  // Réutilise les mêmes dialogs que le modal du jour (vue mois) plutôt que
  // d'en dupliquer pour le carrousel semaine mobile — mais SANS passer par
  // `selectedDay`, qui pilote aussi l'ouverture du modal du jour lui-même
  // (`open={!!selectedDay}` plus bas) : le poser ici ouvrirait ce modal en
  // plus du dialog de création, empilés. `quickCreateDate` est un point
  // d'entrée indépendant, prioritaire sur `selectedDay` dans les deux dialogs
  // (cf. props `date=` plus bas).
  function quickCreateSession(date: Date) {
    setQuickCreateDate(date)
    setCreateOpen(true)
  }

  function quickCreateCustomSession(date: Date) {
    setQuickCreateDate(date)
    setCustomFormOpen(true)
  }

  const daySessions = selectedDay ? sessions.filter((s) => sameDay(s.date, selectedDay)) : []
  const dayCompetitions = selectedDay
    ? competitions.filter((c) => sameDay(c.date, selectedDay))
    : []
  const dayCustomSessions = selectedDay
    ? customSessions.filter((cs) => sameDay(cs.date, selectedDay))
    : []

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Onglets + vue mois/semaine (mobile) — au-dessus de la navigation
          date/création (retour Maksen 2026-09-18 : ordre inversé). */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex flex-1 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
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
              {value === 'sessions' ? (
                <Zap className="size-3.5" />
              ) : (
                <Trophy className="size-3.5" />
              )}
              {/* Libellés raccourcis ici (vs "Entraînements"/"Compétitions" en
                  desktop) : ce bloc partage sa ligne avec le sélecteur
                  Mois/Semaine sur mobile, moins de place disponible. */}
              {value === 'sessions' ? 'Séances' : 'Compét.'}
            </button>
          ))}
        </div>
        <ViewModeToggle view={view} onChange={switchView} layoutId="calendar-view-mobile" />
      </div>

      {/* Mois/semaine + création (mobile) */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => (view === 'week' ? goWeek(-1) : go(-1))}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={view === 'week' ? 'Semaine précédente' : 'Mois précédent'}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-full px-2 py-1 text-sm font-semibold capitalize transition-colors hover:bg-muted"
          >
            {view === 'week' ? weekLabel(weekAnchor) : monthLabel(year, month)}
          </button>
          <button
            onClick={() => (view === 'week' ? goWeek(1) : go(1))}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={view === 'week' ? 'Semaine suivante' : 'Mois suivant'}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* "+ Séance"/"+ Séance perso" retirés le 2026-09-18 en pensant la
            modal du jour suffisante — remis en icône seule ici (retour Maksen
            2026-09-19, "on peut pas ajouter de séance ... sans surcharger le
            visuel surtout mobile") : un jour déjà occupé par une séance/
            compétition navigue direct vers sa fiche au tap plutôt que d'ouvrir
            la modal (cf. onClick de la cellule), donc plus aucun moyen d'
            atteindre le bouton "Ajouter" qui y vivait pour ce jour-là. Masqué
            en vue semaine mobile (retour Maksen 2026-09-19, "ça fait
            doublon") : MobileWeekCarousel a déjà ces mêmes actions par jour,
            ce raccourci d'en-tête ne comble donc un trou qu'en vue mois. */}
        {view !== 'week' && (tab === 'sessions' || tab === 'competitions') && (
          <div className="flex shrink-0 items-center gap-2">
            {tab === 'sessions' && canManageSessions && (
              <button
                onClick={() => quickCreateSession(today)}
                aria-label="Nouvelle séance"
                title="Nouvelle séance"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            )}
            {tab === 'sessions' && linkedAthleteId && (
              <button
                onClick={() => quickCreateCustomSession(today)}
                aria-label="Nouvelle séance personnelle"
                title="Nouvelle séance personnelle"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: CUSTOM_SESSION_COLOR,
                  boxShadow: `0 8px 20px -6px ${CUSTOM_SESSION_COLOR}66`,
                }}
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            )}
            {tab === 'competitions' && canManageActiveTab && (
              <button
                onClick={goToNewCompetition}
                aria-label="Nouvelle compétition"
                title="Nouvelle compétition"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs + légende (desktop, vue classique) — grid à 3 colonnes fixes plutôt que
          flex+justify-between : avec justify-between, la pastille du mois (2e enfant)
          se retrouvait plaquée à droite dès que le bouton "+ Nouvelle..." (3e enfant,
          conditionnel selon le rôle) disparaissait, faute d'un 3e enfant pour la
          répartition. La colonne centrale reste fixe que le bouton existe ou non. */}
      <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-3 sm:grid">
        <div className="flex items-center gap-2 justify-self-start">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 shadow-sm">
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
          <ViewModeToggle view={view} onChange={switchView} layoutId="calendar-view-desktop" />
        </div>

        <div className="flex items-center justify-self-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => (view === 'week' ? goWeek(-1) : go(-1))}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={view === 'week' ? 'Semaine précédente' : 'Mois précédent'}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-full px-2.5 py-1 text-sm font-semibold capitalize transition-colors hover:bg-muted"
          >
            {view === 'week' ? weekLabel(weekAnchor) : monthLabel(year, month)}
          </button>
          <button
            onClick={() => (view === 'week' ? goWeek(1) : go(1))}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={view === 'week' ? 'Semaine suivante' : 'Mois suivant'}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* "+ Nouvelle séance"/"Séance personnalisée" retirés le 2026-09-18 en
            pensant la modal du jour suffisante — remis (retour Maksen
            2026-09-19, "on peut pas ajouter de séance ... tout court") : un
            jour déjà occupé par une seule séance/compétition navigue direct
            vers sa fiche au tap plutôt que d'ouvrir la modal, donc plus aucun
            moyen d'atteindre le bouton "Ajouter" qui y vivait pour ce
            jour-là. Un raccourci en en-tête (sur la date du jour) comble ce
            trou sans dépendre de l'état de la case cliquée. */}
        {(tab === 'sessions' || tab === 'competitions') && (
          <div className="flex items-center justify-self-end gap-2">
            {tab === 'sessions' && canManageSessions && (
              <button
                onClick={() => quickCreateSession(today)}
                className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                Nouvelle séance
              </button>
            )}
            {tab === 'sessions' && linkedAthleteId && (
              <button
                onClick={() => quickCreateCustomSession(today)}
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: CUSTOM_SESSION_COLOR,
                  boxShadow: `0 8px 20px -6px ${CUSTOM_SESSION_COLOR}66`,
                }}
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                Séance perso
              </button>
            )}
            {tab === 'competitions' && canManageActiveTab && (
              <button
                onClick={goToNewCompetition}
                className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                Nouvelle compétition
              </button>
            )}
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-2">
        {(tab === 'sessions' ? trainingTypes : competitionTypes).map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${t.color}22`,
              color: legibleAccent(t.color),
              borderColor: `${t.color}44`,
            }}
          >
            <span className="size-1.5 rounded-full" style={{ background: t.color }} />
            {t.name}
          </span>
        ))}
        {tab === 'sessions' && (linkedAthleteId || customSessions.length > 0) && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${CUSTOM_SESSION_COLOR}22`,
              color: CUSTOM_SESSION_COLOR,
              borderColor: `${CUSTOM_SESSION_COLOR}66`,
            }}
          >
            <span className="size-1.5 rounded-sm" style={{ background: CUSTOM_SESSION_COLOR }} />
            Perso
          </span>
        )}
        {tab === 'sessions' && canManageSessions && (
          // Bouton-pill plutôt que le <Checkbox> shadcn standard (bordure
          // `border-input` bien trop discrète dans les deux thèmes ici, retour
          // Maksen) : très visible à l'état actif (fond plein) comme inactif
          // (bordure marquée), cohérent avec les autres pastilles de la légende.
          <button
            type="button"
            aria-pressed={showAllCustom}
            onClick={() => toggleShowAllCustom(!showAllCustom)}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors',
              showAllCustom
                ? 'border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'border-foreground/25 bg-card text-foreground hover:border-primary/50'
            )}
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors',
                showAllCustom ? 'border-primary-foreground/70' : 'border-foreground/40'
              )}
            >
              {showAllCustom && <Check className="size-3" />}
            </span>
            {/* Libellé raccourci sur mobile (place limitée, objectif zéro
                scroll) — "Perso" est déjà pris par la pastille de légende
                juste au-dessus (couleur des séances perso), "Général" reste
                clair sans ambiguïté avec elle. */}
            <span className="sm:hidden">Général</span>
            <span className="hidden sm:inline">Calendrier général (séances persos athlètes)</span>
          </button>
        )}
        {canManageActiveTab && (
          <Link
            href={tab === 'sessions' ? '/settings?tab=sessions' : '/settings?tab=competitions'}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary',
              !(tab === 'sessions' && canManageSessions) && 'ml-auto'
            )}
          >
            <Settings className="size-3" />
            Gérer
          </Link>
        )}
      </div>

      {/* Vue semaine mobile : carrousel de jours plein écran (swipe natif),
          bien plus lisible sur téléphone que la grille 7 colonnes partagée
          avec la vue mois ci-dessous (retour Maksen 2026-09-18). La vue mois
          garde la grille classique à toutes les tailles, inchangée. */}
      {view === 'week' && (
        <div className="sm:hidden">
          <MobileWeekCarousel
            cells={cells}
            tab={tab}
            sessions={sessions}
            competitions={competitions}
            customSessions={customSessions}
            linkedAthleteId={linkedAthleteId}
            showAllCustom={showAllCustom}
            canManageSessions={canManageSessions}
            canManageCompetitions={canManageCompetitions}
            onCreateSession={quickCreateSession}
            onCreateCustomSession={quickCreateCustomSession}
            onCreateCompetition={quickCreateCompetition}
            weather={weather}
            birthdays={birthdays}
          />
        </div>
      )}

      {/* Grille du mois (+ semaine à partir de sm:) */}
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
          view === 'week' && 'hidden sm:block'
        )}
      >
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
            const dayBirthdays = birthdaysByDate.get(cellDateKey) ?? []
            const items =
              tab === 'sessions'
                ? sessions.filter((s) => sameDay(s.date, cell.date))
                : competitions.filter((c) => sameDay(c.date, cell.date))
            const dayCustom =
              tab === 'sessions' ? customSessions.filter((cs) => sameDay(cs.date, cell.date)) : []
            // Séances persos affichées à côté des vraies séances/compétitions, mais
            // jamais draggables ni auto-ouvertes en détail (pas de /sessions/[id]
            // pour elles) — cf. combined ci-dessous, utilisé seulement pour l'affichage.
            const combined: (CalSession | CalCompetition | CalCustomSession)[] = [
              ...items,
              ...dayCustom,
            ]
            // La vue semaine n'a que 7 cases à remplir au lieu de 6 semaines : plus
            // de place par jour, donc moins besoin de replier sur "+N" prématurément.
            // Cartes semaine plus riches (3 lignes : titre, heure/durée, coach) —
            // moins en tiennent par jour qu'avant (retour Maksen sur plus de détail).
            const maxPills = view === 'week' ? 4 : 3
            const maxDots = view === 'week' ? 8 : 4
            const visiblePills = combined.slice(0, maxPills)
            const overflowPills = combined.length - visiblePills.length
            const visibleDots = combined.slice(0, maxDots)
            const overflowDots = combined.length - visibleDots.length
            const isDropTarget = canManageActiveTab && dragOverDate === cellDateKey
            // Météo uniquement les jours où une séance est placée (pas les
            // compétitions "pour le moment"), à l'heure de la première
            // séance du jour — retour Maksen 2026-09-18.
            const firstSession =
              tab === 'sessions' ? (items[0] as CalSession | undefined) : undefined
            const forecast = firstSession
              ? forecastAt(
                  weather,
                  cellDateKey,
                  firstSession.startTime
                    ? firstSession.startTime.getUTCHours()
                    : DEFAULT_TRAINING_HOUR
                )
              : undefined

            return (
              <button
                key={cell.date.toISOString()}
                data-cell-date={cellDateKey}
                onClick={(e) => {
                  if (suppressClickRef.current) {
                    e.preventDefault()
                    return
                  }
                  if (items.length === 1 && dayCustom.length === 0) {
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
                  'flex h-20 flex-col gap-0.5 overflow-hidden border-r border-b border-border p-1 text-left transition-all duration-200 last:border-r-0 hover:z-10 hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-md sm:h-auto sm:gap-1 sm:p-1.5',
                  view === 'week' ? 'sm:min-h-64' : 'sm:min-h-24',
                  !cell.inMonth && 'bg-muted/20 text-muted-foreground/50',
                  isDropTarget && 'bg-primary/10 ring-2 ring-inset ring-primary/50'
                )}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:size-6 sm:text-xs',
                      isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {cell.day}
                  </span>
                  {/* Badge anniversaire — sur mobile ET desktop, mois comme
                      semaine (contrairement à la météo ci-dessous, cf.
                      lib/calendar-data.ts). Ici seulement `sm:` et plus : la
                      case mois mobile (~50px de large) est trop étroite pour
                      le caser à côté du numéro du jour sans que le prénom se
                      tronque en rien du tout — sur mobile il passe sur sa
                      propre ligne juste en dessous (cf. plus bas). */}
                  {dayBirthdays.length > 0 && (
                    <BirthdayBadge
                      birthdays={dayBirthdays}
                      className="hidden min-w-0 sm:inline-flex"
                    />
                  )}
                  {/* Pastille météo discrète (Marquette-lez-Lille, cf.
                      lib/weather.ts) — uniquement les jours avec une séance
                      placée, à l'heure de celle-ci (`forecast` ci-dessus déjà
                      filtré en ce sens) ; `hidden sm:flex` car la grille mois
                      reste partagée mobile+desktop (contrairement à la
                      semaine, où le mobile passe par MobileWeekCarousel) —
                      trop serré sur les cases mois en mobile. */}
                  {forecast &&
                    (() => {
                      const { Icon, label } = weatherIcon(forecast.code)
                      // `ml-auto` doit être sur ce wrapper (le vrai enfant flex de la
                      // rangée d'en-tête), pas dans WeatherPopover — son propre span
                      // racine (`inline-flex`) est l'enfant flex réel, un ml-auto posé
                      // sur le span météo À L'INTÉRIEUR ne poussait donc rien (retour
                      // Maksen 2026-09-19, la pastille restait collée au badge/numéro
                      // du jour au lieu du bord droit).
                      return (
                        <span className="ml-auto hidden shrink-0 sm:block">
                          <WeatherPopover forecast={forecast}>
                            <span
                              className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground"
                              aria-label={label}
                            >
                              <Icon className="size-3.5" />
                              {Math.round(forecast.temp)}°
                            </span>
                          </WeatherPopover>
                        </span>
                      )
                    })()}
                </div>
                {/* Anniversaire mobile : pleine largeur de la case sur sa
                    propre ligne plutôt qu'à côté du numéro du jour (trop
                    étroit, cf. ci-dessus) — assez de place pour un prénom
                    court à cette largeur-là. */}
                {dayBirthdays.length > 0 && (
                  <BirthdayBadge
                    birthdays={dayBirthdays}
                    compact
                    className="w-fit max-w-full sm:hidden"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {/* Mobile + tablette : pas assez de place pour un libellé lisible,
                      on affiche juste des pastilles colorées (le tap sur le jour
                      ouvre la liste complète, cf. modal du jour). */}
                  <div className="flex flex-wrap items-center gap-1 xl:hidden">
                    {visibleDots.map((item) => {
                      const isCustom = 'athlete' in item
                      const color = isCustom
                        ? CUSTOM_SESSION_COLOR
                        : tab === 'sessions'
                          ? (item as CalSession).trainingType?.color
                          : (item as CalCompetition).competitionType?.color
                      const isBeingDragged =
                        !isCustom && draggingItem?.id === item.id && draggingItem.kind === tab
                      return (
                        <span
                          key={item.id}
                          onPointerDown={(e) => {
                            if (isCustom) return
                            handlePillPointerDown(e, {
                              id: item.id,
                              title: item.title,
                              color: color ?? '#94a3b8',
                              kind: tab,
                            })
                          }}
                          className={cn(
                            'size-1.5 shrink-0',
                            isCustom ? 'rounded-sm' : 'rounded-full',
                            canManageActiveTab && !isCustom && 'touch-none select-none',
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
                      const isCustom = 'athlete' in item
                      const color = isCustom
                        ? CUSTOM_SESSION_COLOR
                        : tab === 'sessions'
                          ? (item as CalSession).trainingType?.color
                          : (item as CalCompetition).competitionType?.color
                      // Une séance perso n'est glissable (desktop uniquement) que par
                      // l'athlète qui l'a créée — jamais par le coach en mode "calendrier
                      // général", même s'il peut la voir.
                      const isOwnCustom = isCustom && item.athlete.id === linkedAthleteId
                      const draggable = isCustom ? isOwnCustom : canManageActiveTab
                      const isBeingDragged =
                        draggingItem?.id === item.id &&
                        draggingItem.kind === (isCustom ? 'custom' : tab)
                      const label =
                        isCustom && showAllCustom
                          ? `${item.athlete.firstName} · ${item.title}`
                          : item.title
                      // Vue semaine : plus de place par jour qu'en vue mois, donc un
                      // peu plus de détail par séance/compétition (dosé — un seul
                      // sous-titre court, jamais l'heure du jour, cf. demande) plutôt
                      // que le même libellé nu qu'en vue mois.
                      // Vue mois : un seul sous-titre discret (jamais l'heure — pas
                      // la place). Vue semaine : plus de place par jour, donc une
                      // vraie petite fiche — heure de début, durée et coach pour les
                      // séances (le hover disparaît alors, cf. plus bas, ces infos
                      // en tiennent lieu).
                      const detailLines: string[] =
                        view === 'week'
                          ? isCustom
                            ? [
                                [
                                  item.startTime ? formatTime(item.startTime) : null,
                                  item.durationMinutes ? `${item.durationMinutes} min` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · '),
                              ].filter(Boolean)
                            : tab === 'sessions'
                              ? [
                                  (item as CalSession).trainingType?.name,
                                  [
                                    (item as CalSession).startTime
                                      ? formatTime((item as CalSession).startTime!)
                                      : null,
                                    (item as CalSession).durationMinutes
                                      ? `${(item as CalSession).durationMinutes} min`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · '),
                                  (item as CalSession).coach
                                    ? `Coach : ${(item as CalSession).coach!.firstName}`
                                    : null,
                                ].filter((l): l is string => !!l)
                              : [
                                  (item as CalCompetition).competitionType?.name,
                                  (item as CalCompetition).location,
                                ].filter((l): l is string => !!l)
                          : [
                              isCustom
                                ? item.durationMinutes
                                  ? `${item.durationMinutes} min`
                                  : null
                                : tab === 'sessions'
                                  ? [
                                      (item as CalSession).trainingType?.name,
                                      (item as CalSession).durationMinutes
                                        ? `${(item as CalSession).durationMinutes} min`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ') || null
                                  : [
                                      (item as CalCompetition).competitionType?.name,
                                      (item as CalCompetition).location,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ') || null,
                            ].filter((l): l is string => !!l)
                      return (
                        <span
                          key={item.id}
                          // Clic direct sur la fiche séance perso (propriétaire ou pas,
                          // le staff y a accès en lecture) — bypasse la modal du jour et
                          // l'auto-navigation "un seul élément" du jour, qui ne
                          // connaissent pas les séances perso.
                          onClick={
                            isCustom
                              ? (e) => {
                                  e.stopPropagation()
                                  if (suppressClickRef.current) return
                                  router.push(`/custom-sessions/${item.id}`)
                                }
                              : undefined
                          }
                          onPointerDown={(e) => {
                            if (isCustom && !isOwnCustom) return
                            handlePillPointerDown(e, {
                              id: item.id,
                              title: item.title,
                              color: color ?? '#94a3b8',
                              kind: isCustom ? 'custom' : tab,
                              athleteId: isCustom ? item.athlete.id : undefined,
                            })
                          }}
                          onMouseEnter={
                            // L'aperçu au survol n'a plus lieu d'être en vue semaine :
                            // la carte y affiche déjà heure/durée/coach en clair, un
                            // hover par-dessus serait redondant (retour Maksen).
                            view === 'week'
                              ? undefined
                              : (e) => {
                                  setHoverItem({ kind: isCustom ? 'custom' : tab, id: item.id })
                                  setHoverRect(e.currentTarget.getBoundingClientRect())
                                }
                          }
                          onMouseLeave={view === 'week' ? undefined : () => setHoverItem(null)}
                          className={cn(
                            'flex shrink-0 gap-0.5 truncate rounded',
                            view === 'week'
                              ? 'flex-col items-start px-2 py-1.5 text-xs'
                              : 'items-center px-1.5 py-0.5 text-[10px]',
                            'font-semibold',
                            isCustom ? 'border border-dashed' : 'border border-transparent',
                            isCustom && 'cursor-pointer',
                            draggable && 'touch-none select-none',
                            isBeingDragged && 'opacity-30'
                          )}
                          style={{
                            backgroundColor: `${color ?? '#94a3b8'}22`,
                            color: color ? legibleAccent(color) : '#64748b',
                            borderColor: isCustom ? `${color}66` : undefined,
                          }}
                        >
                          <span className="flex w-full min-w-0 items-center gap-0.5">
                            {draggable && <GripVertical className="size-2.5 shrink-0 opacity-60" />}
                            <span className="truncate">{label}</span>
                          </span>
                          {view === 'week' &&
                            detailLines.map((line, i) => (
                              <span key={i} className="truncate text-[10px] font-medium opacity-75">
                                {line}
                              </span>
                            ))}
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

      {/* Aperçu au survol (souris uniquement, vue mois seulement — la vue semaine
          affiche déjà heure/durée/coach directement sur la carte, cf. plus haut). */}
      {view === 'month' && hoverItem && hoverRect && !draggingItem && (
        <HoverPreview
          hoverItem={hoverItem}
          rect={hoverRect}
          sessions={sessions}
          competitions={competitions}
          customSessions={customSessions}
          showAllCustom={showAllCustom}
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
                <>
                  {daySessions.length === 0 && dayCustomSessions.length === 0 ? (
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
                            <div className="text-xs text-muted-foreground">
                              {s.trainingType.name}
                            </div>
                          )}
                        </div>
                        {s.durationMinutes && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {s.durationMinutes} min
                          </span>
                        )}
                      </Link>
                    ))
                  )}

                  {dayCustomSessions.map((cs) => {
                    const isMine = linkedAthleteId && cs.athlete.id === linkedAthleteId
                    const rowContent = (
                      <>
                        <span
                          className="size-2 shrink-0 rounded-sm"
                          style={{ background: CUSTOM_SESSION_COLOR }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{cs.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Perso
                            {showAllCustom && !isMine
                              ? ` · ${fullName(cs.athlete.firstName, cs.athlete.lastName)}`
                              : ''}
                          </div>
                        </div>
                        {cs.durationMinutes && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {cs.durationMinutes} min
                          </span>
                        )}
                      </>
                    )
                    // Toujours la fiche séance perso, propriétaire ou pas (le staff
                    // y a accès en lecture, seul le propriétaire peut y modifier).
                    return (
                      <Link
                        key={cs.id}
                        href={`/custom-sessions/${cs.id}`}
                        className="flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 transition-colors hover:bg-muted/40"
                        style={{ borderColor: `${CUSTOM_SESSION_COLOR}66` }}
                      >
                        {rowContent}
                      </Link>
                    )
                  })}
                </>
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
            {tab === 'sessions' && linkedAthleteId && (
              <button
                onClick={openCreateCustom}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderColor: `${CUSTOM_SESSION_COLOR}66`, color: CUSTOM_SESSION_COLOR }}
              >
                <Plus className="size-4" />
                Ajouter une séance personnelle
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
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setQuickCreateDate(null)
        }}
        date={quickCreateDate ?? selectedDay ?? today}
        trainingTypes={trainingTypes}
        coaches={coaches}
        currentUserId={currentUserId}
        onSuccess={() => {
          setSelectedDay(null)
          setQuickCreateDate(null)
        }}
      />

      {linkedAthleteId && (
        <CustomSessionFormDialog
          open={customFormOpen}
          onOpenChange={(open) => {
            setCustomFormOpen(open)
            if (!open) setQuickCreateDate(null)
          }}
          athleteId={linkedAthleteId}
          date={quickCreateDate ?? selectedDay ?? today}
          onSuccess={() => {
            setSelectedDay(null)
            setQuickCreateDate(null)
          }}
        />
      )}
    </div>
  )
}

/** Bascule Mois/Semaine — même pattern pill-bar à indicateur glissant que les
 * onglets Entraînements/Compétitions (cf. §7 CLAUDE.md). `layoutId` distinct
 * par instance (mobile + desktop montées en même temps, juste masquées en CSS
 * l'une ou l'autre selon la largeur d'écran). */
function ViewModeToggle({
  view,
  onChange,
  layoutId,
}: {
  view: 'month' | 'week'
  onChange: (v: 'month' | 'week') => void
  layoutId: string
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-0.5 shadow-sm">
      {(['month', 'week'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
            view === value
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {view === value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
          {value === 'month' ? 'Mois' : 'Semaine'}
        </button>
      ))}
    </div>
  )
}

function HoverPreview({
  hoverItem,
  rect,
  sessions,
  competitions,
  customSessions,
  showAllCustom,
}: {
  hoverItem: { kind: Tab | 'custom'; id: string }
  rect: DOMRect
  sessions: CalSession[]
  competitions: CalCompetition[]
  customSessions: CalCustomSession[]
  showAllCustom: boolean
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

  if (hoverItem.kind === 'custom') {
    const cs = customSessions.find((c) => c.id === hoverItem.id)
    if (!cs) return null
    return (
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-2xl border border-border bg-card text-xs shadow-xl"
        style={{ ...positionStyle, position: 'fixed' }}
      >
        <div className="flex items-center gap-2.5 p-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${CUSTOM_SESSION_COLOR}1f`, color: CUSTOM_SESSION_COLOR }}
          >
            <Dumbbell className="size-4.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold">{cs.title}</div>
            <div className="text-muted-foreground">
              Perso
              {showAllCustom ? ` · ${fullName(cs.athlete.firstName, cs.athlete.lastName)}` : ''}
            </div>
          </div>
        </div>
        <div className="space-y-1.5 border-t border-border px-3 py-2.5 text-muted-foreground">
          {/* Durée seule, jamais l'heure du jour — pas pertinente ici (cf. demande). */}
          {cs.durationMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 shrink-0" />
              {cs.durationMinutes} min
            </div>
          )}
          <p className="line-clamp-3 italic">{cs.description || 'Aucun programme renseigné.'}</p>
        </div>
      </div>
    )
  }

  if (hoverItem.kind === 'sessions') {
    const session = sessions.find((s) => s.id === hoverItem.id)
    if (!session) return null
    const color = session.trainingType?.color ?? '#94a3b8'
    return (
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-2xl border border-border bg-card text-xs shadow-xl"
        style={{ ...positionStyle, position: 'fixed' }}
      >
        <div className="flex items-center gap-2.5 p-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            <Zap className="size-4.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold">{session.title}</div>
            {session.trainingType && (
              <div className="text-muted-foreground">{session.trainingType.name}</div>
            )}
          </div>
        </div>
        <div className="space-y-1.5 border-t border-border px-3 py-2.5 text-muted-foreground">
          {session.durationMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 shrink-0" />
              {session.durationMinutes} min
            </div>
          )}
          {session.coach && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  session.coachPresent ? 'bg-emerald-500' : 'bg-rose-500'
                )}
              />
              {session.coach.firstName}
            </div>
          )}
          <p className="line-clamp-3 italic">
            {session.description || 'Aucun programme renseigné.'}
          </p>
          <div className="flex items-center gap-1 border-t border-border pt-2 text-[11px] font-semibold text-primary">
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
      className="pointer-events-none fixed z-50 overflow-hidden rounded-2xl border border-border bg-card text-xs shadow-xl"
      style={{ ...positionStyle, position: 'fixed' }}
    >
      <div className="flex items-center gap-2.5 p-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Trophy className="size-4.5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold">{competition.title}</div>
          {competition.competitionType && (
            <div className="text-muted-foreground">{competition.competitionType.name}</div>
          )}
        </div>
      </div>
      <div className="space-y-1.5 border-t border-border px-3 py-2.5 text-muted-foreground">
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
        <div className="flex items-center gap-1 border-t border-border pt-2 text-[11px] font-semibold text-primary">
          Cliquer pour voir la fiche
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  )
}
