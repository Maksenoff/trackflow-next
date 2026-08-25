'use client'

import { GOAL_DISCIPLINE_CATEGORIES } from '@/lib/disciplines'

/** Sélecteur de discipline à choix unique pour un objectif — catégorie Espoir/Senior
 * uniquement, groupée et colorée par famille (sprints, sauts, relais...). Chaque
 * pastille porte sa couleur de famille en permanence (pas juste au clic) — la
 * sélection se distingue par un remplissage plus fort + une bordure/ombre. */
export function GoalDisciplinePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (code: string | null) => void
}) {
  return (
    <div className="space-y-4">
      {GOAL_DISCIPLINE_CATEGORIES.map((category) => (
        <div key={category.key}>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <span className="size-3 shrink-0 rounded-full" style={{ background: category.color }} />
            {category.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(category.disciplines).map(([label, code]) => {
              const active = value === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChange(active ? null : code)}
                  className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: `color-mix(in srgb, ${category.color} 28%, transparent)`,
                          color: category.color,
                          borderColor: category.color,
                          boxShadow: `0 0 0 1px ${category.color}`,
                        }
                      : {
                          backgroundColor: `color-mix(in srgb, ${category.color} 10%, transparent)`,
                          color: `color-mix(in srgb, ${category.color} 85%, var(--foreground))`,
                          borderColor: `color-mix(in srgb, ${category.color} 30%, transparent)`,
                        }
                  }
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
