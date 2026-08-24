import { rpeColor, rpeLabel } from '@/lib/rpe'
import type { SessionDetail } from '@/lib/calendar-data'

export function RpeSummaryCard({
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          RPE moyen
        </h2>
      </div>
      <div className="flex min-h-56 flex-1 items-center p-6">
        {avg === null ? (
          <p className="w-full py-4 text-center text-sm text-muted-foreground">
            Aucun ressenti enregistré.
          </p>
        ) : (
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
            <div className="shrink-0 text-center">
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
        )}
      </div>
    </div>
  )
}
