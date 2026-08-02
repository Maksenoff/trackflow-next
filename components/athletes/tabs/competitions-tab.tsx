import Link from 'next/link'
import { Trophy, Check } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import type { AthleteDetail } from '@/lib/athletes-data'

type Registration = AthleteDetail['competitionRegistrations'][number]

export function CompetitionsTab({ registrations }: { registrations: Registration[] }) {
  if (registrations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <Trophy className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune inscription en compétition.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {registrations.map((reg) => {
        const disciplines = JSON.parse(reg.disciplines) as string[]
        const color = reg.competition.competitionType?.color ?? '#f59e0b'
        return (
          <Link
            key={reg.id}
            href={`/competitions/${reg.competition.id}`}
            className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{reg.competition.title}</span>
                {reg.ffaRegistered && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" />
                    FFA
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {reg.competition.location && (
                  <span className="text-xs text-muted-foreground">{reg.competition.location}</span>
                )}
                {disciplines.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[10px]">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge
                className="border"
                style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
              >
                {reg.competition.competitionType?.name ?? '—'}
              </Badge>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatFullDate(reg.competition.date)}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
