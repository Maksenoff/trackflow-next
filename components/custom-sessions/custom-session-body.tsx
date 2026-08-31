import { FileText, Users } from 'lucide-react'
import { rpeColor } from '@/lib/rpe'
import { RpeLogForm } from '@/components/sessions/rpe-log-form'
import type { CustomSessionDetail } from '@/lib/calendar-data'

/**
 * Programme + ressenti d'une séance perso — le ressenti réutilise exactement
 * les mêmes composants/rendu que les séances coach (RpeLogForm pour la
 * saisie/modif par le propriétaire, même style gros chiffre + barre 10
 * segments pour la lecture seule côté coach/admin) plutôt qu'une variante
 * maison, pour que ça ne "ressemble pas" différemment (retour Maksen).
 */
export function CustomSessionBody({
  detail,
  isPast,
  isSelf,
}: {
  detail: CustomSessionDetail
  isPast: boolean
  isSelf: boolean
}) {
  const hasLog = detail.skipped || detail.difficulty !== null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <FileText className="size-3.5 text-muted-foreground" />
          <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Programme
          </h2>
        </div>
        <div className="min-h-56 flex-1 p-6">
          {detail.description ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {detail.description}
            </p>
          ) : (
            <p className="pt-6 text-center text-sm text-muted-foreground">
              Aucun programme renseigné.
            </p>
          )}
        </div>
      </div>

      {isSelf ? (
        isPast ? (
          <RpeLogForm
            sessionId={detail.id}
            athleteId={detail.athleteId}
            initial={
              hasLog
                ? {
                    difficulty: detail.difficulty,
                    comment: detail.comment,
                    skipped: detail.skipped,
                  }
                : undefined
            }
            endpoint={`/api/athletes/${detail.athleteId}/custom-sessions/${detail.id}`}
            method="PATCH"
          />
        ) : (
          <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Disponible une fois la séance terminée.</p>
          </div>
        )
      ) : !isPast || !hasLog ? (
        <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <Users className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isPast ? 'Ressenti non renseigné.' : 'Disponible une fois la séance terminée.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Ressenti</p>
              {detail.comment && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  &quot;{detail.comment}&quot;
                </p>
              )}
            </div>
            {detail.skipped ? (
              <span className="shrink-0 text-xs font-semibold text-red-500 dark:text-red-400">
                Non effectuée
              </span>
            ) : detail.difficulty !== null ? (
              <div className="shrink-0 text-right">
                <p
                  className="font-mono text-2xl leading-none font-extrabold"
                  style={{ color: rpeColor(detail.difficulty) }}
                >
                  {detail.difficulty}
                  <span className="text-[11px] font-normal text-muted-foreground">/10</span>
                </p>
                <div className="mt-1.5 flex justify-end gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="h-1 w-3 rounded-full"
                      style={{
                        background:
                          i < (detail.difficulty ?? 0)
                            ? rpeColor(detail.difficulty!)
                            : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
