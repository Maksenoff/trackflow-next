import Link from 'next/link'
import { CalendarDays, TrendingUp, Target, CheckCircle2, Pencil, ExternalLink } from 'lucide-react'
import { calcAge, initials, GENDER_LABELS, formatFollowedSince } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import type { AthleteDetail } from '@/lib/athletes-data'

export function ProfileHeader({ athlete, canEdit }: { athlete: AthleteDetail; canEdit: boolean }) {
  const age = calcAge(athlete.birthDate)
  const goalsAchieved = athlete.goals.filter((g) => g.status === 'achieved').length
  const goalsInProgress = athlete.goals.filter((g) => g.status === 'in_progress').length

  const bannerStyle =
    athlete.bannerConfig.mode === 'photo' && athlete.bannerUrl
      ? {
          backgroundImage: `url(${athlete.bannerUrl})`,
          backgroundSize: `${(athlete.bannerConfig.zoom ?? 1) * 100}%`,
          backgroundPosition: 'center',
        }
      : {
          background: `linear-gradient(135deg, ${athlete.bannerConfig.color ?? '#6366f1'}, ${athlete.bannerConfig.color ?? '#6366f1'}33)`,
        }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-32 bg-cover bg-center sm:h-40" style={bannerStyle}>
        {canEdit && (
          <Link
            href={`/athletes/${athlete.id}/edit`}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45"
          >
            <Pencil className="size-3.5" />
            Modifier
          </Link>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
          {athlete.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={athlete.photoUrl}
              alt=""
              className="size-20 rounded-2xl object-cover ring-4 ring-card sm:size-24"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground ring-4 ring-card sm:size-24">
              {initials(athlete.firstName, athlete.lastName)}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {athlete.firstName} {athlete.lastName}
            </h1>
            {athlete.licenseNumber && (
              <span className="text-sm text-muted-foreground">#{athlete.licenseNumber}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {age !== null && <span>{age} ans</span>}
            {athlete.gender && <span>{GENDER_LABELS[athlete.gender] ?? athlete.gender}</span>}
            <span>Suivi depuis {formatFollowedSince(athlete.createdAt)}</span>
          </div>

          {athlete.disciplines.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {athlete.disciplines.map((d) => {
                const color = athlete.disciplineColors[d] ?? '#6366f1'
                return (
                  <span
                    key={d}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${color}18`,
                      color,
                      borderColor: `${color}40`,
                    }}
                  >
                    {DISCIPLINE_LABELS[d] ?? d}
                  </span>
                )
              })}
            </div>
          )}

          {athlete.ffaProfileUrl && (
            <a
              href={athlete.ffaProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Profil athle.fr
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
          <StatTile icon={CalendarDays} label="Séances" value={athlete.athleteSessions.length} />
          <StatTile icon={TrendingUp} label="Performances" value={athlete.performances.length} />
          <StatTile icon={CheckCircle2} label="Objectifs atteints" value={goalsAchieved} />
          <StatTile icon={Target} label="Objectifs en cours" value={goalsInProgress} />
        </div>
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
