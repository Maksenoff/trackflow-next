'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Settings, Trophy, Users, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { buildMonthGrid, monthLabel, sameDay, addMonths } from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'
import {
  SessionFormDialog,
  type TrainingTypeOption,
} from '@/components/calendar/session-form-dialog'

type CalSession = {
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  trainingType: { id: string; name: string; color: string } | null
}

type CalCompetition = {
  id: string
  title: string
  date: Date
  location: string | null
  competitionType: { id: string; name: string; color: string } | null
  registrationCount: number
  isRegistered: boolean
}

export function CalendarView({
  year,
  month,
  sessions,
  competitions,
  trainingTypes,
  competitionTypes,
  canManageSessions,
  isAdmin,
}: {
  year: number
  month: number
  sessions: CalSession[]
  competitions: CalCompetition[]
  trainingTypes: TrainingTypeOption[]
  competitionTypes: TrainingTypeOption[]
  canManageSessions: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'sessions' | 'competitions'>('sessions')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = new Date()

  function go(delta: number) {
    const { year: y, month: m } = addMonths(year, month, delta)
    router.push(`/calendar?year=${y}&month=${m}`)
  }

  function goToday() {
    const now = new Date()
    router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
  }

  const daySessions = selectedDay ? sessions.filter((s) => sameDay(s.date, selectedDay)) : []
  const dayCompetitions = selectedDay
    ? competitions.filter((c) => sameDay(c.date, selectedDay))
    : []

  return (
    <div className="space-y-5">
      {/* Tabs + légende */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
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

        {tab === 'sessions' && canManageSessions && (
          <button
            onClick={() => setCreateOpen(true)}
            className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            Nouvelle séance
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
        {isAdmin && (
          <Link
            href={tab === 'sessions' ? '/admin/session-types' : '/admin/competition-types'}
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
            const items =
              tab === 'sessions'
                ? sessions.filter((s) => sameDay(s.date, cell.date))
                : competitions.filter((c) => sameDay(c.date, cell.date))
            const visible = items.slice(0, 3)
            const overflow = items.length - visible.length

            return (
              <button
                key={cell.date.toISOString()}
                onClick={() => setSelectedDay(cell.date)}
                className={cn(
                  'flex min-h-20 flex-col gap-1 border-r border-b border-border p-1.5 text-left transition-colors last:border-r-0 hover:bg-muted/40 sm:min-h-24',
                  !cell.inMonth && 'bg-muted/20 text-muted-foreground/50'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {cell.day}
                </span>
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {visible.map((item) => {
                    const color =
                      tab === 'sessions'
                        ? (item as CalSession).trainingType?.color
                        : (item as CalCompetition).competitionType?.color
                    return (
                      <span
                        key={item.id}
                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${color ?? '#94a3b8'}22`,
                          color: color ?? '#64748b',
                        }}
                      >
                        {item.title}
                      </span>
                    )
                  })}
                  {overflow > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      +{overflow}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

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
            {tab === 'competitions' && isAdmin && (
              <Link
                href="/competitions/new"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Plus className="size-4" />
                Ajouter une compétition
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SessionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        date={selectedDay ?? today}
        trainingTypes={trainingTypes}
      />
    </div>
  )
}
