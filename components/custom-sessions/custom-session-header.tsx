'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Hourglass, Pencil, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/date'
import { CUSTOM_SESSION_COLOR } from '@/lib/custom-session'
import { fullName } from '@/lib/athlete'
import {
  CustomSessionFormDialog,
  type CustomSessionFormInitial,
} from '@/components/calendar/custom-session-form-dialog'
import type { CustomSessionDetail } from '@/lib/calendar-data'

/**
 * Fiche séance perso — même structure que SessionHeader (séances coach), mais
 * "Modifier" (titre/date/heure/durée/programme, suppression incluse) réservé au
 * propriétaire : c'est désormais le SEUL endroit où une séance perso se modifie
 * (le calendrier n'ouvre plus qu'un aperçu qui renvoie ici).
 */
export function CustomSessionHeader({
  detail,
  isPast,
  isSelf,
  showAthleteName,
}: {
  detail: CustomSessionDetail
  isPast: boolean
  isSelf: boolean
  /** Coach/admin consultant la fiche d'un athlète autre qu'eux-mêmes. */
  showAthleteName: boolean
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const color = CUSTOM_SESSION_COLOR

  const editInitial: CustomSessionFormInitial = {
    id: detail.id,
    title: detail.title,
    date: detail.date,
    startTime: detail.startTime,
    durationMinutes: detail.durationMinutes,
    description: detail.description,
  }

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
              <Badge
                className="border border-dashed"
                style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
              >
                Perso
              </Badge>
              <Badge variant={isPast ? 'secondary' : 'default'}>
                {isPast ? 'Passée' : 'À venir'}
              </Badge>
              {showAthleteName && (
                <span className="text-sm text-muted-foreground">
                  {fullName(detail.athlete.firstName, detail.athlete.lastName)}
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{detail.title}</h1>
          </div>

          {isSelf && (
            <div className="flex shrink-0 items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Modifier
              </Button>
              <CustomSessionFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                athleteId={detail.athleteId}
                date={detail.date}
                initialData={editInitial}
                onDeleted={() => router.push('/calendar')}
              />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
          <StatTile
            icon={CalendarIcon}
            label={String(detail.date.getFullYear())}
            value={detail.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
            color={color}
          />
          <StatTile
            icon={Clock}
            label="Heure"
            value={detail.startTime ? formatTime(detail.startTime) : '—'}
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
