'use client'

import { GOAL_DISCIPLINE_GROUPS } from '@/lib/disciplines'
import { cn } from '@/lib/utils'

/** Sélecteur de discipline à choix unique pour un objectif — catégorie Espoir/Senior uniquement. */
export function GoalDisciplinePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (code: string | null) => void
}) {
  return (
    <div className="space-y-3">
      {Object.entries(GOAL_DISCIPLINE_GROUPS).map(([groupLabel, entries]) => (
        <div key={groupLabel}>
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {groupLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(entries).map(([label, code]) => {
              const active = value === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChange(active ? null : code)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
