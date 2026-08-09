import Link from 'next/link'
import { Users } from 'lucide-react'
import { rpeColor, rpeLabel } from '@/lib/rpe'
import { initials, fullName } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import type { SessionDetail } from '@/lib/calendar-data'

export function RpePanel({
  athleteSessions,
}: {
  athleteSessions: SessionDetail['athleteSessions']
}) {
  const withDifficulty = athleteSessions.filter((as) => as.difficulty !== null)
  const avg =
    withDifficulty.length > 0
      ? Math.round(
          (withDifficulty.reduce((sum, as) => sum + (as.difficulty ?? 0), 0) /
            withDifficulty.length) *
            10
        ) / 10
      : null

  if (athleteSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
        <Users className="mx-auto mb-2 size-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aucun ressenti enregistré pour l&apos;instant.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {avg !== null && (
        <div
          className="overflow-hidden rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: `${rpeColor(avg)}33` }}
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="shrink-0 text-center">
              <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                RPE moyen
              </p>
              <p
                className="font-mono text-4xl leading-none font-extrabold"
                style={{ color: rpeColor(avg) }}
              >
                {avg}
                <span className="text-base font-normal text-muted-foreground">/10</span>
              </p>
              <p className="mt-1 text-xs font-semibold" style={{ color: rpeColor(avg) }}>
                {rpeLabel(avg)}
              </p>
            </div>
            <div className="w-full flex-1">
              <div className="mb-2 flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-full"
                    style={{ background: i < avg ? rpeColor(avg) : 'var(--border)' }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {withDifficulty.length} retour{withDifficulty.length > 1 ? 's' : ''} sur{' '}
                {athleteSessions.length} athlète{athleteSessions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {athleteSessions.map((as) => {
          const disciplines = (JSON.parse(as.athlete.disciplines) as string[])
            .map((d) => DISCIPLINE_LABELS[d] ?? d)
            .join(', ')
          return (
            <div key={as.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {initials(as.athlete.firstName, as.athlete.lastName)}
                  </div>
                  <div>
                    <Link
                      href={`/athletes/${as.athlete.id}`}
                      className="text-sm font-semibold hover:text-primary hover:underline"
                    >
                      {fullName(as.athlete.firstName, as.athlete.lastName)}
                    </Link>
                    {disciplines && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{disciplines}</p>
                    )}
                    {as.comment && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        &quot;{as.comment}&quot;
                      </p>
                    )}
                  </div>
                </div>
                {as.skipped ? (
                  <span className="shrink-0 text-xs font-semibold text-red-500 dark:text-red-400">
                    Non effectuée
                  </span>
                ) : as.difficulty !== null ? (
                  <div className="shrink-0 text-right">
                    <p
                      className="font-mono text-2xl leading-none font-extrabold"
                      style={{ color: rpeColor(as.difficulty) }}
                    >
                      {as.difficulty}
                      <span className="text-[11px] font-normal text-muted-foreground">/10</span>
                    </p>
                    <div className="mt-1.5 flex justify-end gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="h-1 w-3 rounded-full"
                          style={{
                            background:
                              i < (as.difficulty ?? 0) ? rpeColor(as.difficulty!) : 'var(--border)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
