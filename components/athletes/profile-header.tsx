import Link from 'next/link'
import {
  CalendarDays,
  TrendingUp,
  Target,
  CheckCircle2,
  Pencil,
  ExternalLink,
  BarChart3,
  Trophy,
} from 'lucide-react'
import { calcAge, initials, GENDER_LABELS, formatFollowedSince } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { FfaSyncButtons } from '@/components/athletes/ffa-sync-buttons'
import type { AthleteDetail } from '@/lib/athletes-data'

export function ProfileHeader({
  athlete,
  canEdit,
  canEditProfile,
  isAdmin,
}: {
  athlete: AthleteDetail
  canEdit: boolean
  canEditProfile: boolean
  isAdmin: boolean
}) {
  const age = calcAge(athlete.birthDate)
  const goalsAchieved = athlete.goals.filter((g) => g.status === 'achieved').length
  const goalsInProgress = athlete.goals.filter((g) => g.status === 'in_progress').length

  const isBannerPhoto = athlete.bannerConfig.mode === 'photo' && athlete.bannerUrl
  const bannerColor = athlete.bannerConfig.color ?? '#6366f1'

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div
        className="relative h-32 overflow-hidden sm:h-40"
        style={
          isBannerPhoto
            ? undefined
            : { background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}33)` }
        }
      >
        {isBannerPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={athlete.bannerUrl!}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{
              objectPosition: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
              transform: `scale(${athlete.bannerConfig.zoom ?? 1})`,
              transformOrigin: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
            }}
          />
        )}
        <div className="absolute top-4 right-4 left-4 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {canEdit && athlete.ffaProfileUrl && (
            <FfaSyncButtons athleteId={athlete.id} showFullResync={isAdmin} />
          )}
          {athlete.performances.length > 0 && (
            <Link
              href={`/athletes/${athlete.id}/stats`}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:px-3"
            >
              <BarChart3 className="size-3.5" />
              <span className="hidden sm:inline">Stats avancées</span>
            </Link>
          )}
          <Link
            href={`/athletes/${athlete.id}/podiums`}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:px-3"
          >
            <Trophy className="size-3.5" />
            <span className="hidden sm:inline">Podiums</span>
          </Link>
          {canEditProfile && (
            <Link
              href={`/athletes/${athlete.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:px-3"
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Modifier</span>
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
          {athlete.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={athlete.photoUrl}
              alt=""
              className="size-24 rounded-2xl object-cover ring-4 ring-card sm:size-28"
              style={{
                objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
              }}
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground ring-4 ring-card sm:size-28">
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a
                href={athlete.ffaProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Profil athle.fr
                <ExternalLink className="size-3.5" />
              </a>
              {athlete.lastSyncedAt && (
                <span className="text-xs text-muted-foreground">
                  Dernière sync FFA : {formatSyncDateTime(athlete.lastSyncedAt)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={CalendarDays} label="Séances" value={athlete.athleteSessions.length} />
            <StatTile icon={TrendingUp} label="Performances" value={athlete.performances.length} />
            <StatTile icon={CheckCircle2} label="Objectifs atteints" value={goalsAchieved} />
            <StatTile icon={Target} label="Objectifs en cours" value={goalsInProgress} />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatSyncDateTime(date: Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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
