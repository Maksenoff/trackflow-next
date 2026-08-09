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
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      <div
        className="relative h-28 sm:h-36"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}33)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full opacity-40 blur-3xl"
          style={{ background: color }}
        />
        <Trophy
          className="absolute right-6 bottom-4 size-16 opacity-20 sm:size-20"
          style={{ color: 'white' }}
          strokeWidth={1.5}
        />
        {canManage && (
          <div className="absolute top-4 right-4">
            <CompetitionActions competitionId={competition.id} />
          </div>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="-mt-8 flex flex-wrap items-end gap-2 sm:-mt-10">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ring-4 ring-card sm:size-20"
            style={{ background: color }}
          >
            <Trophy className="size-7 sm:size-9" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {competition.title}
          </h1>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
          <StatTile icon={Users} label="Inscrits" value={competition.registrations.length} />
          <StatTile
            icon={CalendarDays}
            label={String(competition.date.getFullYear())}
            value={competition.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
          />
          <StatTile icon={MapPin} label="Lieu" value={competition.location || '—'} />
          <StatTile
            icon={Trophy}
            label="Statut"
            value={isPast ? 'Terminée' : 'À venir'}
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
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5">
      <Icon className={`size-4 shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="min-w-0">
        <div className={`truncate text-lg leading-none font-bold ${accent ? 'text-primary' : ''}`}>
          {value}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
