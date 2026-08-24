'use client'

import { DEFAULT_DISCIPLINE_COLORS } from '@/lib/disciplines'
import { cn } from '@/lib/utils'

// Même palette que les couleurs de spécialité sur le profil athlète — cohérence
// visuelle voulue par le propriétaire du projet.
export function TeamColorPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_DISCIPLINE_COLORS.map((c) => {
        const active = value === c
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            className={cn(
              'size-8 rounded-full transition-transform',
              active
                ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card'
                : 'hover:scale-105'
            )}
            style={{ backgroundColor: c }}
          />
        )
      })}
    </div>
  )
}
