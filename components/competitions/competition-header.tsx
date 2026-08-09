'use client'

import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CompetitionActions } from '@/components/competitions/competition-actions'
import { ATHLETE_SPECIALTIES } from '@/lib/disciplines'
import type { CompetitionDetail } from '@/lib/competitions-data'

const TOTAL_STANDARD_DISCIPLINES = Object.values(ATHLETE_SPECIALTIES).reduce(
  (sum, group) => sum + Object.keys(group).length,
  0
)

export function CompetitionHeader({
  competition,
  isPast,
  canManage,
}: {
  competition: CompetitionDetail
  isPast: boolean
  canManage: boolean
}) {
  const color = competition.competitionType?.color ?? '#f59e0b'
  const disciplineCount =
    competition.availableDisciplines.length > 0
      ? competition.availableDisciplines.length
      : TOTAL_STANDARD_DISCIPLINES

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
              {competition.competitionType && (
                <Badge
                  className="border"
                  style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
                >
                  {competition.competitionType.name}
                </Badge>
              )}
              <Badge variant={isPast ? 'secondary' : 'default'}>
                {isPast ? 'Passée' : 'À venir'}
              </Badge>
              <Badge variant="outline">{disciplineCount} disciplines</Badge>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {competition.title}
            </h1>
          </div>

          {canManage && <CompetitionActions competitionId={competition.id} />}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
          <StatTile
            icon={Users}
            label="Inscrits"
            value={competition.registrations.length}
            color={color}
          />
          <StatTile
            icon={CalendarDays}
            label={String(competition.date.getFullYear())}
            value={competition.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
            color={color}
          />
          <StatTile icon={MapPin} label="Lieu" value={competition.location || '—'} color={color} />
          <StatTile
            icon={Trophy}
            label="Statut"
            value={isPast ? 'Terminée' : 'À venir'}
            color={color}
            accent={!isPast}
          />
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
