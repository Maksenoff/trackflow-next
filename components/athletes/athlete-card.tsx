import Link from 'next/link'
import { CalendarDays, TrendingUp, Target } from 'lucide-react'
import { calcAge, initials, GENDER_LABELS } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'

export type AthleteCardData = {
  id: string
  firstName: string
  lastName: string
  photoUrl: string | null
  birthDate: Date | null
  gender: string | null
  disciplines: string[]
  sessionsCount: number
  performancesCount: number
  goalsCount: number
}

export function AthleteCard({ athlete }: { athlete: AthleteCardData }) {
  const age = calcAge(athlete.birthDate)

  return (
    <Link
      href={`/athletes/${athlete.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex items-center gap-3">
        {athlete.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={athlete.photoUrl}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground">
            {initials(athlete.firstName, athlete.lastName)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-base font-bold">
            {athlete.firstName} {athlete.lastName}
          </div>
          <div className="text-xs text-muted-foreground">
            {age !== null ? `${age} ans` : 'Âge inconnu'}
            {athlete.gender ? ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}` : ''}
          </div>
        </div>
      </div>

      {athlete.disciplines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {athlete.disciplines.slice(0, 3).map((d) => (
            <span
              key={d}
              className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              {DISCIPLINE_LABELS[d] ?? d}
            </span>
          ))}
          {athlete.disciplines.length > 3 && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{athlete.disciplines.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {athlete.sessionsCount}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="size-3.5" />
          {athlete.performancesCount}
        </span>
        <span className="flex items-center gap-1">
          <Target className="size-3.5" />
          {athlete.goalsCount}
        </span>
      </div>
    </Link>
  )
}
