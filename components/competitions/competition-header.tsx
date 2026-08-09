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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-1.5" style={{ background: color }} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              {competition.competitionType && (
                <Badge
                  className="border"
                  style={{
                    backgroundColor: `${color}22`,
                    color,
                    borderColor: `${color}44`,
                  }}
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

        <div className="mt-6 grid grid-cols-2 divide-x divide-border border-t border-border pt-5 sm:grid-cols-4">
          <StatCell value={competition.registrations.length} label="Inscrits" />
          <StatCell
            value={competition.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
            label={String(competition.date.getFullYear())}
          />
          <StatCell value={competition.location || '—'} label="Lieu" />
          <StatCell
            value={isPast ? 'Terminée' : 'À venir'}
            label="Statut"
            valueClassName={isPast ? 'text-muted-foreground' : 'text-primary'}
          />
        </div>
      </div>
    </div>
  )
}

function StatCell({
  value,
  label,
  valueClassName,
}: {
  value: string | number
  label: string
  valueClassName?: string
}) {
  return (
    <div className="px-2 text-center first:pl-0 sm:px-4">
      <div className={`truncate text-lg font-extrabold sm:text-xl ${valueClassName ?? ''}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  )
}
