'use client'

import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Hourglass, UserRound, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SessionActions } from '@/components/sessions/session-actions'
import { cn } from '@/lib/utils'
import type { SessionDetail } from '@/lib/calendar-data'
import type { CoachOption, TrainingTypeOption } from '@/components/calendar/session-form-dialog'

export function SessionHeader({
  detail,
  isPast,
  canEdit,
  trainingTypes,
  coaches,
}: {
  detail: SessionDetail
  isPast: boolean
  canEdit: boolean
  trainingTypes: TrainingTypeOption[]
  coaches: CoachOption[]
}) {
  const color = detail.trainingType?.color ?? '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: color }}
      />
      <div className="h-1.5" style={{ background: color }} />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              {detail.trainingType && (
                <Badge
                  className="border"
                  style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
                >
                  {detail.trainingType.name}
                </Badge>
              )}
              <Badge variant={isPast ? 'secondary' : 'default'}>
                {isPast ? 'Passée' : 'À venir'}
              </Badge>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{detail.title}</h1>
          </div>

          {canEdit && (
            <div className="flex shrink-0 items-center gap-2">
              <SessionActions
                sessionId={detail.id}
                trainingTypes={trainingTypes}
                coaches={coaches}
                initialData={{
                  title: detail.title,
                  date: detail.date,
                  startTime: detail.startTime,
                  durationMinutes: detail.durationMinutes,
                  trainingTypeId: detail.trainingTypeId,
                  description: detail.description,
                  coachId: detail.coachId,
                  coachPresent: detail.coachPresent,
                }}
              />
            </div>
          )}
        </div>

        <div
          className={cn(
            'mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4',
            detail.coach && 'lg:grid-cols-5'
          )}
        >
          <StatTile
            icon={CalendarIcon}
            label={String(detail.date.getFullYear())}
            value={detail.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
            color={color}
          />
          <StatTile
            icon={Clock}
            label="Heure"
            value={
              detail.startTime
                ? detail.startTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'
            }
            color={color}
          />
          <StatTile
            icon={Hourglass}
            label="Durée"
            value={detail.durationMinutes ? `${detail.durationMinutes} min` : '—'}
            color={color}
          />
          <StatTile
            icon={Zap}
            label="Statut"
            value={isPast ? 'Terminée' : 'À venir'}
            color={color}
            accent={!isPast}
          />
          {detail.coach && (
            <StatTile
              icon={UserRound}
              label="Coach"
              value={detail.coach.firstName}
              color={detail.coachPresent ? '#10b981' : '#f43f5e'}
              accent
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  color,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string | number
  color: string
  accent?: boolean
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: `${color}0f` }}
    >
      <Icon className="size-4 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <div
          className="truncate text-lg leading-none font-bold"
          style={accent ? { color } : undefined}
        >
          {value}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
