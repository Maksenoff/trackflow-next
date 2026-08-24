'use client'

import { UserRound } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { CoachOption } from '@/components/calendar/session-form-dialog'

export function CoachPillPicker({
  coaches,
  value,
  onChange,
  present,
  onPresentChange,
}: {
  coaches: CoachOption[]
  value: string | undefined
  onChange: (id: string | undefined) => void
  present: boolean
  onPresentChange: (present: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Coach</Label>
      <div className="flex flex-wrap items-center gap-2">
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
          Aucun coach
        </button>
        {coaches.map((c) => {
          const active = value === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <UserRound className="size-3.5 shrink-0" />
              {c.firstName}
            </button>
          )
        })}

        {value && (
          <label className="ml-auto flex items-center gap-2 rounded-full border border-input px-3 py-2 text-sm font-medium select-none">
            <Checkbox
              checked={present}
              onCheckedChange={(checked) => onPresentChange(checked === true)}
            />
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                present ? 'bg-emerald-500' : 'bg-rose-500'
              )}
            />
            Présent
          </label>
        )}
      </div>
    </div>
  )
}
