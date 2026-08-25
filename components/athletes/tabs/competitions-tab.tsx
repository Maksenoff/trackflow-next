'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Trophy, Check, CalendarCheck, MessageCircleQuestion, Ban } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import { rpeColor } from '@/lib/rpe'
import { computeDebriefStatus, type DebriefStatus } from '@/lib/session-debrief'
import { Badge } from '@/components/ui/badge'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import {
  CompetitionDebriefDialog,
  type DebriefCompetitionInfo,
} from '@/components/athletes/competition-debrief-dialog'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Registration = AthleteDetail['competitionRegistrations'][number]

type FilterKey = 'to_debrief' | 'logged' | 'not_done'

const FILTERS: { key: FilterKey; label: string; icon: typeof CalendarCheck }[] = [
  { key: 'to_debrief', label: 'À débriefer', icon: MessageCircleQuestion },
  { key: 'logged', label: 'Faites', icon: CalendarCheck },
  { key: 'not_done', label: 'Non faites', icon: Ban },
]

function matchesFilter(status: DebriefStatus, filter: FilterKey): boolean {
  if (filter === 'not_done') return status === 'skipped' || status === 'auto_skipped'
  return status === filter
}

function feelingColor(v: number): string {
  return rpeColor(10 - v)
}

function statusAccent(status: DebriefStatus, feeling: number | null, fallback: string) {
  if (status === 'logged' && feeling !== null) return feelingColor(feeling)
  if (status === 'to_debrief') return 'var(--primary)'
  if (status === 'skipped' || status === 'auto_skipped') return '#f87171'
  return fallback
}

export function CompetitionsTab({
  registrations,
  canEdit,
}: {
  registrations: Registration[]
  canEdit: boolean
}) {
  const [filter, setFilter] = useState<FilterKey>('to_debrief')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [dialogReg, setDialogReg] = useState<DebriefCompetitionInfo | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const withStatus = useMemo(
    () =>
      registrations.map((reg) => ({
        ...reg,
        parsedDisciplines: JSON.parse(reg.disciplines) as string[],
        status: computeDebriefStatus(reg.competition.date, {
          difficulty: reg.debrief?.feeling ?? null,
          skipped: reg.debrief?.skipped ?? false,
        }),
      })),
    [registrations]
  )

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { to_debrief: 0, logged: 0, not_done: 0 }
    for (const r of withStatus) {
      if (r.status === 'to_debrief') c.to_debrief++
      else if (r.status === 'logged') c.logged++
      else if (r.status === 'skipped' || r.status === 'auto_skipped') c.not_done++
    }
    return c
  }, [withStatus])

  const byStatus = withStatus.filter((r) => matchesFilter(r.status, filter))

  const availableTypes = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    for (const r of byStatus) {
      if (r.competition.competitionType) {
        map.set(r.competition.competitionType.id, r.competition.competitionType)
      }
    }
    return Array.from(map.entries()).map(([id, t]) => ({ id, ...t }))
  }, [byStatus])

  function switchFilter(key: FilterKey) {
    setFilter(key)
    setTypeFilter(null)
  }

  const filtered = byStatus.filter(
    (r) => !typeFilter || r.competition.competitionType?.id === typeFilter
  )

  function openDebrief(reg: (typeof withStatus)[number]) {
    setDialogReg({
      id: reg.competition.id,
      registrationId: reg.id,
      title: reg.competition.title,
      date: reg.competition.date,
      competitionType: reg.competition.competitionType,
      disciplines: reg.parsedDisciplines,
    })
    setDialogOpen(true)
  }

  const dialogInitial = dialogReg
    ? (() => {
        const reg = registrations.find((r) => r.id === dialogReg.registrationId)
        return reg?.debrief
          ? { feeling: reg.debrief.feeling, notes: reg.debrief.notes, skipped: reg.debrief.skipped }
          : null
      })()
    : null

  if (registrations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <Trophy className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune inscription en compétition.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
        {FILTERS.map((f) => {
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => switchFilter(f.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <f.icon className="size-3.5" />
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-bold',
                  isActive ? 'bg-primary/20' : 'bg-muted'
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          )
        })}
      </div>

      {availableTypes.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTypes.map((t) => {
            const isActive = typeFilter === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(isActive ? null : t.id)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-transparent'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
                style={{
                  backgroundColor: `${t.color}22`,
                  color: t.color,
                  borderColor: isActive ? `${t.color}66` : 'transparent',
                }}
              >
                {t.name}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <Trophy className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune compétition dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filtered.map((reg) => {
            const color = reg.competition.competitionType?.color ?? '#f59e0b'
            const accent = statusAccent(reg.status, reg.debrief?.feeling ?? null, color)
            const clickable = canEdit && reg.status !== 'upcoming'
            const content = (
              <div
                className={cn(
                  'flex h-full min-h-28 flex-col rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors',
                  clickable && 'cursor-pointer hover:border-primary/40'
                )}
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold">{reg.competition.title}</span>
                      {reg.competition.competitionType && (
                        <Badge
                          className="shrink-0 border"
                          style={{
                            backgroundColor: `${color}22`,
                            color,
                            borderColor: `${color}44`,
                          }}
                        >
                          {reg.competition.competitionType.name}
                        </Badge>
                      )}
                      {reg.ffaRegistered && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3" />
                          FFA
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatFullDate(reg.competition.date)}
                      {reg.competition.location ? ` · ${reg.competition.location}` : ''}
                    </div>
                  </div>
                  <StatusBadge
                    status={reg.status}
                    feeling={reg.debrief?.feeling ?? null}
                    color={accent}
                  />
                </div>
                {reg.parsedDisciplines.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reg.parsedDisciplines.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[10px]">
                        {DISCIPLINE_LABELS[d] ?? d}
                      </Badge>
                    ))}
                  </div>
                )}
                {reg.debrief?.notes && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {reg.debrief.notes}
                  </p>
                )}
              </div>
            )

            if (clickable) {
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => openDebrief(reg)}
                  className="block h-full text-left"
                >
                  {content}
                </button>
              )
            }
            return (
              <Link key={reg.id} href={`/competitions/${reg.competition.id}`} className="block">
                {content}
              </Link>
            )
          })}
        </div>
      )}

      <CompetitionDebriefDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competition={dialogReg}
        initial={dialogInitial}
      />
    </div>
  )
}

function StatusBadge({
  status,
  feeling,
  color,
}: {
  status: DebriefStatus
  feeling: number | null
  color: string
}) {
  if (status === 'logged' && feeling !== null) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-transparent text-[11px] font-bold"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {feeling}/10
      </Badge>
    )
  }
  if (status === 'to_debrief') {
    return (
      <Badge
        variant="outline"
        className="shrink-0 animate-pulse border-primary/30 bg-primary/10 text-[11px] font-bold text-primary"
      >
        À débriefer
      </Badge>
    )
  }
  if (status === 'skipped' || status === 'auto_skipped') {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-red-500/30 bg-red-500/10 text-[11px] font-bold text-red-500 dark:text-red-400"
      >
        Non disputée
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="shrink-0 text-[11px] font-medium text-muted-foreground">
      À venir
    </Badge>
  )
}
