import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import type { AthleteDetail } from '@/lib/athletes-data'

type AthleteSession = AthleteDetail['athleteSessions'][number]
type CustomSession = AthleteDetail['customSessions'][number]

export function SessionsTab({
  athleteSessions,
  customSessions,
}: {
  athleteSessions: AthleteSession[]
  customSessions: CustomSession[]
}) {
  if (athleteSessions.length === 0 && customSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
        <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune séance enregistrée pour cet athlète.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {athleteSessions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-muted-foreground">
            Séances assignées
          </div>
          {athleteSessions.map((as) => (
            <Link
              key={as.id}
              href={`/sessions/${as.session.id}`}
              className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{as.session.title}</span>
                  {as.session.trainingType && (
                    <Badge
                      className="border"
                      style={{
                        backgroundColor: `${as.session.trainingType.color}22`,
                        color: as.session.trainingType.color,
                        borderColor: `${as.session.trainingType.color}44`,
                      }}
                    >
                      {as.session.trainingType.name}
                    </Badge>
                  )}
                  {as.skipped && (
                    <span className="text-xs font-semibold text-red-500 dark:text-red-400">
                      Non effectuée
                    </span>
                  )}
                </div>
                {as.comment && <p className="mt-0.5 text-xs text-muted-foreground">{as.comment}</p>}
              </div>
              <div className="shrink-0 text-right">
                {as.difficulty !== null && (
                  <div className="text-sm font-bold text-primary">{as.difficulty}/10</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {formatFullDate(as.session.date)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {customSessions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-muted-foreground">
            Séances personnelles
          </div>
          {customSessions.map((cs) => (
            <div
              key={cs.id}
              className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{cs.title}</div>
                {cs.comment && <p className="mt-0.5 text-xs text-muted-foreground">{cs.comment}</p>}
              </div>
              <div className="shrink-0 text-right">
                {cs.difficulty !== null && (
                  <div className="text-sm font-bold text-primary">{cs.difficulty}/10</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {formatFullDate(cs.performedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
