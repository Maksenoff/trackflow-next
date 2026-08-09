'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ColorTypeOption = { id: string; name: string; color: string }

export function TypePillPicker({
  label,
  types,
  value,
  onChange,
  noneLabel = 'Aucun type',
}: {
  label: string
  types: ColorTypeOption[]
  value: string | undefined
  onChange: (id: string | undefined) => void
  noneLabel?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            'rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
            !value
              ? 'border-foreground/25 bg-muted text-foreground'
              : 'border-border text-muted-foreground hover:bg-muted/50'
          )}
        >
          {noneLabel}
        </button>
        {types.map((t) => {
          const active = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                active ? 'shadow-sm' : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
              style={
                active
                  ? { backgroundColor: `${t.color}22`, color: t.color, borderColor: `${t.color}66` }
                  : undefined
              }
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
              {t.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
