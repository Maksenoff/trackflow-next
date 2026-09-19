'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarOff,
  ChevronRight,
  ChevronsRight,
  Clock,
  MapPin,
  Plus,
  UserRound,
  Users,
} from 'lucide-react'
import type { CalendarCell } from '@/lib/calendar-grid'
import { sameDay, toDateInputValue } from '@/lib/calendar-grid'
import { fullName } from '@/lib/athlete'
import { formatTime } from '@/lib/date'
import { legibleAccent } from '@/lib/color-contrast'
import { CUSTOM_SESSION_COLOR } from '@/lib/custom-session'
import {
  weatherIcon,
  weatherTone,
  forecastAt,
  DEFAULT_TRAINING_HOUR,
  type WeeklyHourlyWeather,
} from '@/lib/weather'
import { WeatherPopover } from '@/components/calendar/weather-popover'
import { BirthdayBadge, type CalBirthday } from '@/components/calendar/birthday-badge'
import { cn } from '@/lib/utils'

type Tab = 'sessions' | 'competitions'

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
  competitionType: { id: string; name: string; color: string } | null
  description: string | null
  registrationCount: number
  ffaRegisteredCount: number
}
type CalCustomSession = {
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  description: string | null
  athlete: { id: string; firstName: string; lastName: string }
}

/**
 * Vue "semaine" mobile — carrousel de jours plein écran à défilement/swipe
 * natif (scroll-snap, pas de gestion JS du geste) plutôt que la grille 7
 * colonnes partagée avec la vue mois : sur un écran de téléphone, 7 colonnes
 * ne laissent la place que pour des puces minuscules, ce qui ne se
 * différenciait pas vraiment de la vue mois (retour Maksen 2026-09-18). Le
 * drag-and-drop entre jours n'a pas de sens ici (un seul jour visible à la
 * fois) — pas de portage du système de pointer-drag de CalendarView, tap
 * uniquement.
 */
export function MobileWeekCarousel({
  cells,
  tab,
  sessions,
  competitions,
  customSessions,
  linkedAthleteId,
  showAllCustom,
  canManageSessions,
  canManageCompetitions,
  onCreateSession,
  onCreateCustomSession,
  onCreateCompetition,
  weather,
  birthdays,
}: {
  cells: CalendarCell[]
  tab: Tab
  sessions: CalSession[]
  competitions: CalCompetition[]
  customSessions: CalCustomSession[]
  linkedAthleteId?: string | null
  showAllCustom: boolean
  canManageSessions: boolean
  canManageCompetitions: boolean
  onCreateSession: (date: Date) => void
  onCreateCustomSession: (date: Date) => void
  onCreateCompetition: (date: Date) => void
  /** Prévisions météo heure par heure du club (cf. lib/weather.ts) —
   * remplace la pastille jour/date par un pictogramme météo uniquement les
   * jours où une séance est placée, à l'heure de celle-ci. */
  weather?: WeeklyHourlyWeather
  /** Anniversaires de la semaine affichée (cf. lib/calendar-data.ts). */
  birthdays?: CalBirthday[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const [activeIndex, setActiveIndex] = useState(0)

  // Recentre sur aujourd'hui (ou le 1er jour de la semaine si hors plage) à
  // chaque nouvelle semaine chargée — sans animation, pour ne pas donner
  // l'impression que la semaine "glisse" au moment du chargement.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const todayIndex = cells.findIndex((c) => sameDay(c.date, today))
    const index = todayIndex >= 0 ? todayIndex : 0
    track.scrollTo({ left: index * track.clientWidth, behavior: 'instant' as ScrollBehavior })
    setActiveIndex(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells])

  function handleScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  function dayHasEvent(date: Date) {
    return tab === 'sessions'
      ? sessions.some((s) => sameDay(s.date, date)) ||
          customSessions.some((cs) => sameDay(cs.date, date))
      : competitions.some((c) => sameDay(c.date, date))
  }

  // Prochain jour (après celui affiché) qui a au moins un événement — pour la
  // flèche "prochain évènement" (retour Maksen 2026-09-18), utile quand la
  // semaine a des jours creux entre deux séances/compétitions.
  const nextEventIndex = cells.findIndex((c, i) => i > activeIndex && dayHasEvent(c.date))

  return (
    <div className="space-y-3">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
      >
        {cells.map((cell) => {
          const isToday = sameDay(cell.date, today)
          const daySessions =
            tab === 'sessions' ? sessions.filter((s) => sameDay(s.date, cell.date)) : []
          const dayCompetitions =
            tab === 'competitions' ? competitions.filter((c) => sameDay(c.date, cell.date)) : []
          const dayCustom =
            tab === 'sessions' ? customSessions.filter((cs) => sameDay(cs.date, cell.date)) : []
          const isEmpty =
            tab === 'sessions'
              ? daySessions.length === 0 && dayCustom.length === 0
              : dayCompetitions.length === 0
          // Météo réservée à l'onglet Entraînements pour le moment (retour
          // Maksen 2026-09-18 : "sur le compet ne met pas du tout de météo,
          // on voit ça plus tard"), et uniquement les jours avec une séance
          // placée, à l'heure de la première séance du jour.
          const forecast =
            tab === 'sessions' && daySessions.length > 0
              ? forecastAt(
                  weather,
                  toDateInputValue(cell.date),
                  daySessions[0].startTime
                    ? daySessions[0].startTime.getUTCHours()
                    : DEFAULT_TRAINING_HOUR
                )
              : undefined
          const forecastIcon = forecast ? weatherIcon(forecast.code) : null
          const dayBirthdays = (birthdays ?? []).filter((b) => sameDay(b.date, cell.date))

          return (
            <div key={cell.date.toISOString()} className="w-full shrink-0 snap-center px-0.5">
              <div className="min-h-[60vh] rounded-[22px] border border-border bg-gradient-to-b from-card to-card/95 p-4 shadow-card-elevated">
                <div className="mb-4 flex items-center gap-2.5">
                  {/* Pictogramme météo (Marquette-lez-Lille, à l'heure de la
                      séance du jour, cf. lib/weather.ts) quand une séance est
                      placée ce jour et qu'une prévision existe, sinon la
                      pastille jour/date classique (jour sans séance, au-delà
                      de l'horizon de prévision, ou jour déjà passé). Teinte par
                      famille météo (weatherTone) plutôt qu'un gris neutre —
                      nettement plus lisible en un coup d'œil (retour Maksen
                      2026-09-18, "on voit pas bien"). Reste dans sa teinte
                      météo normale même pour aujourd'hui — pas de halo couleur
                      du thème par-dessus (retour Maksen 2026-09-18, "je trouve
                      ça pas top") : c'est le libellé de date à côté qui porte
                      le repère "aujourd'hui" désormais. */}
                  {forecastIcon ? (
                    <WeatherPopover forecast={forecast!}>
                      <span
                        className={cn(
                          'flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-center leading-none',
                          weatherTone(forecast!.code)
                        )}
                      >
                        <forecastIcon.Icon
                          className="size-6"
                          strokeWidth={2.25}
                          aria-label={forecastIcon.label}
                        />
                        <span className="text-xs font-extrabold tabular-nums">
                          {Math.round(forecast!.temp)}°
                        </span>
                      </span>
                    </WeatherPopover>
                  ) : (
                    <span
                      className={cn(
                        'flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-center leading-none',
                        isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/60'
                      )}
                    >
                      {/* Jour sans séance (donc sans météo) : un pictogramme
                          neutre plutôt que répéter "JEU 17" à côté du libellé
                          de date complet juste à droite — faisait doublon
                          (retour Maksen 2026-09-18). */}
                      <CalendarOff
                        className="size-5 opacity-60"
                        aria-label="Aucune séance ce jour"
                      />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'truncate text-base font-bold capitalize',
                        forecastIcon && isToday && 'text-primary'
                      )}
                    >
                      {cell.date.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </div>
                    {/* Couleur fixe (pas `text-primary`) : la case météo garde
                        déjà sa propre couleur, et le libellé de date ci-dessus
                        prend maintenant l'accent du thème quand météo il y a —
                        rajouter la couleur du thème ici en plus ferait trop
                        (retour Maksen 2026-09-18). */}
                    {isToday && (
                      <div className="text-xs font-semibold" style={{ color: '#f43f5e' }}>
                        Aujourd&apos;hui
                      </div>
                    )}
                    {dayBirthdays.length > 0 && (
                      <BirthdayBadge birthdays={dayBirthdays} className="mt-1" />
                    )}
                  </div>
                  {/* Flèche vers le prochain jour avec un évènement — placée ici
                      (pas près des points de pagination en bas de carte) : elle
                      s'y retrouvait sous le bouton flottant de signalement de
                      bug, donc inatteignable au tap (retour Maksen 2026-09-18). */}
                  {nextEventIndex !== -1 && (
                    <button
                      type="button"
                      onClick={() => scrollToIndex(nextEventIndex)}
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                    >
                      Suivant
                      <ChevronsRight className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {isEmpty ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {tab === 'sessions'
                        ? 'Aucune séance ce jour.'
                        : 'Aucune compétition ce jour.'}
                    </p>
                  ) : tab === 'sessions' ? (
                    <>
                      {daySessions.map((s) => {
                        const meta = [
                          s.startTime ? formatTime(s.startTime) : null,
                          s.durationMinutes ? `${s.durationMinutes} min` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                        const color = s.trainingType?.color ?? '#94a3b8'
                        return (
                          <Link
                            key={s.id}
                            href={`/sessions/${s.id}`}
                            className="group block rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:bg-muted/30"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ background: color }}
                                  />
                                  <span className="truncate text-sm font-bold">{s.title}</span>
                                </div>
                                {s.trainingType && (
                                  <span
                                    className="mt-1.5 ml-[18px] inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                    style={{
                                      background: `${color}22`,
                                      color: legibleAccent(color),
                                    }}
                                  >
                                    {s.trainingType.name}
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>

                            {(meta || s.coach) && (
                              <div className="mt-2.5 ml-[18px] space-y-1.5">
                                {meta && (
                                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                                    {meta}
                                  </div>
                                )}
                                {s.coach && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <UserRound className="size-3.5 shrink-0" />
                                    Coach : {s.coach.firstName}
                                    <span
                                      className={cn(
                                        'size-1.5 shrink-0 rounded-full',
                                        s.coachPresent ? 'bg-emerald-500' : 'bg-rose-500'
                                      )}
                                      title={s.coachPresent ? 'Présent' : 'Absent'}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="mt-2.5 ml-[18px] line-clamp-2 text-xs text-muted-foreground italic">
                              {s.description || 'Aucun programme renseigné.'}
                            </p>
                          </Link>
                        )
                      })}
                      {dayCustom.map((cs) => {
                        const isMine = linkedAthleteId && cs.athlete.id === linkedAthleteId
                        const meta = [
                          cs.startTime ? formatTime(cs.startTime) : null,
                          cs.durationMinutes ? `${cs.durationMinutes} min` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                        return (
                          <Link
                            key={cs.id}
                            href={`/custom-sessions/${cs.id}`}
                            className="group block rounded-2xl border border-dashed bg-card p-3.5 shadow-sm transition-colors hover:bg-muted/30"
                            style={{ borderColor: `${CUSTOM_SESSION_COLOR}66` }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2.5 shrink-0 rounded-sm"
                                    style={{ background: CUSTOM_SESSION_COLOR }}
                                  />
                                  <span className="truncate text-sm font-bold">{cs.title}</span>
                                </div>
                                <span
                                  className="mt-1.5 ml-[18px] inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    background: `${CUSTOM_SESSION_COLOR}22`,
                                    color: CUSTOM_SESSION_COLOR,
                                  }}
                                >
                                  Perso
                                  {showAllCustom && !isMine
                                    ? ` · ${fullName(cs.athlete.firstName, cs.athlete.lastName)}`
                                    : ''}
                                </span>
                              </div>
                              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                            {meta && (
                              <div className="mt-2.5 ml-[18px] flex items-center gap-1.5 text-sm font-semibold">
                                <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                                {meta}
                              </div>
                            )}
                            <p className="mt-2.5 ml-[18px] line-clamp-2 text-xs text-muted-foreground italic">
                              {cs.description || 'Aucun programme renseigné.'}
                            </p>
                          </Link>
                        )
                      })}
                    </>
                  ) : (
                    dayCompetitions.map((c) => {
                      const color = c.competitionType?.color ?? '#94a3b8'
                      return (
                        <Link
                          key={c.id}
                          href={`/competitions/${c.id}`}
                          className="group block rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2.5 shrink-0 rounded-full"
                                  style={{ background: color }}
                                />
                                <span className="truncate text-sm font-bold">{c.title}</span>
                              </div>
                              {c.competitionType && (
                                <span
                                  className="mt-1.5 ml-[18px] inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{ background: `${color}22`, color: legibleAccent(color) }}
                                >
                                  {c.competitionType.name}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <div className="mt-2.5 ml-[18px] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {c.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                {c.location}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" />
                              {c.registrationCount} inscrit{c.registrationCount > 1 ? 's' : ''}
                            </span>
                            {c.ffaRegisteredCount > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {c.ffaRegisteredCount} FFA
                              </span>
                            )}
                          </div>
                          <p className="mt-2.5 ml-[18px] line-clamp-2 text-xs text-muted-foreground italic">
                            {c.description || 'Aucune information complémentaire.'}
                          </p>
                        </Link>
                      )
                    })
                  )}
                </div>

                {/* "+ Ajouter une séance"/"séance perso" retirés le
                    2026-09-18 en pensant que le raccourci du mois (modal du
                    jour) suffisait — faux sur cette vue semaine mobile, qui
                    ne passe jamais par ce modal : aucune façon d'ajouter une
                    séance depuis ici. Remis (retour Maksen 2026-09-19, "on
                    peut plus ajouter de séance"). */}
                <div className="mt-3 space-y-2">
                  {tab === 'sessions' && canManageSessions && (
                    <button
                      onClick={() => onCreateSession(cell.date)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="size-4" />
                      Ajouter une séance ce jour
                    </button>
                  )}
                  {tab === 'sessions' && linkedAthleteId && (
                    <button
                      onClick={() => onCreateCustomSession(cell.date)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                      style={{
                        borderColor: `${CUSTOM_SESSION_COLOR}66`,
                        color: CUSTOM_SESSION_COLOR,
                      }}
                    >
                      <Plus className="size-4" />
                      Ajouter une séance personnelle
                    </button>
                  )}
                  {tab === 'competitions' && canManageCompetitions && (
                    <button
                      onClick={() => onCreateCompetition(cell.date)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="size-4" />
                      Ajouter une compétition ce jour
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {cells.map((cell, i) => (
          <button
            key={cell.date.toISOString()}
            aria-label={`Aller au ${cell.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}`}
            onClick={() => scrollToIndex(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  )
}
