'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CalendarCheck, MessageCircleQuestion, Ban } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import { rpeColor, rpeLabel } from '@/lib/rpe'
import { computeDebriefStatus, type DebriefStatus } from '@/lib/session-debrief'
import { CUSTOM_SESSION_COLOR } from '@/lib/custom-session'
import { Badge } from '@/components/ui/badge'
import {
  SessionDebriefDialog,
  type DebriefSessionInfo,
} from '@/components/athletes/session-debrief-dialog'
import { cn } from '@/lib/utils'
import { legibleAccent } from '@/lib/color-contrast'
import type { AthleteDetail } from '@/lib/athletes-data'

type SessionWindowItem = AthleteDetail['sessionsWindow'][number]
type CustomSession = AthleteDetail['customSessions'][number]

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

function statusAccent(status: DebriefStatus, difficulty: number | null, fallback: string) {
  if (status === 'logged' && difficulty !== null) return rpeColor(difficulty)
  if (status === 'to_debrief') return 'var(--primary)'
  if (status === 'skipped' || status === 'auto_skipped') return '#f87171'
  return fallback
}

/** Séance coach ou séance personnelle athlète, unifiées pour le même cycle de
 * filtre/debrief (voir demande "séances persos dans à débriefer/déjà débriefé"). */
type MergedItem = {
  kind: 'session' | 'custom'
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  trainingType: { id: string; name: string; color: string } | null
  log: { difficulty: number | null; comment: string | null; skipped: boolean } | null
  status: DebriefStatus
}

export function SessionsTab({
  athleteId,
  sessionsWindow,
  customSessions,
  canEdit,
}: {
  athleteId: string
  sessionsWindow: SessionWindowItem[]
  customSessions: CustomSession[]
  canEdit: boolean
}) {
  const [filter, setFilter] = useState<FilterKey>('to_debrief')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [dialogSession, setDialogSession] = useState<DebriefSessionInfo | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const withStatus = useMemo<MergedItem[]>(() => {
    const fromSessions: MergedItem[] = sessionsWindow.map((s) => ({
      kind: 'session',
      id: s.id,
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
      trainingType: s.trainingType,
      log: s.log,
      status: computeDebriefStatus(s.date, s.log, s.startTime, s.durationMinutes),
    }))
    const fromCustom: MergedItem[] = customSessions.map((cs) => ({
      kind: 'custom',
      id: cs.id,
      title: cs.title,
      date: cs.date,
      startTime: cs.startTime,
      durationMinutes: cs.durationMinutes,
      trainingType: null,
      log: { difficulty: cs.difficulty, comment: cs.comment, skipped: cs.skipped },
      status: computeDebriefStatus(
        cs.date,
        { difficulty: cs.difficulty, skipped: cs.skipped },
        cs.startTime,
        cs.durationMinutes
      ),
    }))
    return [...fromSessions, ...fromCustom].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [sessionsWindow, customSessions])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { to_debrief: 0, logged: 0, not_done: 0 }
    for (const s of withStatus) {
      if (s.status === 'to_debrief') c.to_debrief++
      else if (s.status === 'logged') c.logged++
      else if (s.status === 'skipped' || s.status === 'auto_skipped') c.not_done++
    }
    return c
  }, [withStatus])

  const byStatus = withStatus.filter((s) => matchesFilter(s.status, filter))

  const availableTypes = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    for (const s of byStatus) {
      if (s.trainingType) map.set(s.trainingType.id, s.trainingType)
    }
    return Array.from(map.entries()).map(([id, t]) => ({ id, ...t }))
  }, [byStatus])

  function switchFilter(key: FilterKey) {
    setFilter(key)
    setTypeFilter(null)
  }

  const filtered = byStatus.filter((s) => !typeFilter || s.trainingType?.id === typeFilter)

  // Les séances perso ne s'ouvrent plus jamais dans ce dialogue de debrief
  // inline : elles renvoient toujours vers leur fiche (/custom-sessions/[id]),
  // seul endroit désormais pour consulter et modifier ressenti + infos. Ce
  // dialogue ne sert donc plus qu'aux séances coach.
  function openDebrief(item: MergedItem) {
    setDialogSession({
      id: item.id,
      title: item.title,
      date: item.date,
      trainingType: item.trainingType,
    })
    setDialogOpen(true)
  }

  const dialogInitial = dialogSession
    ? (withStatus.find((s) => s.id === dialogSession.id && s.kind === 'session')?.log ?? null)
    : null

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
                  color: legibleAccent(t.color),
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
          <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune séance dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filtered.map((item) => {
            const isCustom = item.kind === 'custom'
            const accent = isCustom
              ? CUSTOM_SESSION_COLOR
              : statusAccent(item.status, item.log?.difficulty ?? null, '#6366f1')
            // Les séances perso ne s'ouvrent plus jamais en inline ici : elles
            // renvoient toujours vers leur fiche, seul endroit où on peut
            // désormais les modifier et saisir/modifier le ressenti.
            const clickable = !isCustom && canEdit && item.status !== 'upcoming'
            const content = (
              <div
                className={cn(
                  'flex h-full min-h-28 flex-col rounded-xl border bg-card p-3.5 shadow-sm transition-colors',
                  isCustom ? 'border-dashed border-border' : 'border-border',
                  clickable && 'cursor-pointer hover:border-primary/40'
                )}
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold">{item.title}</span>
                      {item.trainingType && (
                        <Badge
                          className="shrink-0 border"
                          style={{
                            backgroundColor: `${item.trainingType.color}22`,
                            color: legibleAccent(item.trainingType.color),
                            borderColor: `${item.trainingType.color}44`,
                          }}
                        >
                          {item.trainingType.name}
                        </Badge>
                      )}
                      {isCustom && (
                        <Badge
                          className="shrink-0 border border-dashed"
                          style={{
                            backgroundColor: `${CUSTOM_SESSION_COLOR}22`,
                            color: CUSTOM_SESSION_COLOR,
                            borderColor: `${CUSTOM_SESSION_COLOR}44`,
                          }}
                        >
                          Perso
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatFullDate(item.date)}
                      {item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <StatusBadge
                      status={item.status}
                      difficulty={item.log?.difficulty ?? null}
                      color={accent}
                    />
                  </div>
                </div>
                {item.log?.comment && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {item.log.comment}
                  </p>
                )}
              </div>
            )

            // Une séance perso renvoie toujours vers sa fiche dédiée
            // (/custom-sessions/[id]) — c'est là, et seulement là, qu'on peut
            // désormais la modifier ou saisir un ressenti.
            if (isCustom) {
              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={`/custom-sessions/${item.id}`}
                  className="block"
                >
                  {content}
                </Link>
              )
            }
            if (clickable) {
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => openDebrief(item)}
                  className="block h-full text-left"
                >
                  {content}
                </button>
              )
            }
            return (
              <Link key={`${item.kind}-${item.id}`} href={`/sessions/${item.id}`} className="block">
                {content}
              </Link>
            )
          })}
        </div>
      )}

      <SessionDebriefDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={dialogSession}
        athleteId={athleteId}
        initial={dialogInitial}
      />
    </div>
  )
}

function StatusBadge({
  status,
  difficulty,
  color,
}: {
  status: DebriefStatus
  difficulty: number | null
  color: string
}) {
  if (status === 'logged' && difficulty !== null) {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-transparent text-[11px] font-bold"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {difficulty}/10 · {rpeLabel(difficulty)}
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
        Non effectuée
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="shrink-0 text-[11px] font-medium text-muted-foreground">
      À venir
    </Badge>
  )
}
