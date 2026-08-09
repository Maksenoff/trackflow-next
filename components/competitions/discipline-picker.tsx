'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ATHLETE_SPECIALTIES } from '@/lib/disciplines'
import { cn } from '@/lib/utils'

export function DisciplinePicker({
  groups = ATHLETE_SPECIALTIES,
  value,
  onChange,
  allowCustom = false,
}: {
  groups?: Record<string, Record<string, string>>
  value: string[]
  onChange: (codes: string[]) => void
  allowCustom?: boolean
}) {
  const [customInput, setCustomInput] = useState('')

  const allCodes = Object.values(groups).flatMap((g) => Object.values(g))
  const knownCodes = new Set(allCodes)
  const customValues = value.filter((c) => !knownCodes.has(c))

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  function toggleGroup(codes: string[]) {
    const allSelected = codes.every((c) => value.includes(c))
    onChange(
      allSelected
        ? value.filter((c) => !codes.includes(c))
        : Array.from(new Set([...value, ...codes]))
    )
  }

  function addCustom() {
    const v = customInput.trim()
    if (!v || value.includes(v)) return
    onChange([...value, v])
    setCustomInput('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onChange(Array.from(new Set([...value, ...allCodes])))}
          className="text-primary hover:underline"
        >
          Tout sélectionner
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={() => onChange(customValues)}
          className="text-muted-foreground hover:underline"
        >
          Tout décocher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(groups).map(([groupLabel, entries]) => {
          const codes = Object.values(entries)
          const allSelected = codes.length > 0 && codes.every((c) => value.includes(c))
          return (
            <div key={groupLabel}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {groupLabel}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(codes)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors',
                    allSelected
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  Tous
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(entries).map(([label, code]) => {
                  const active = value.includes(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggle(code)}
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
          )
        })}
      </div>

      {allowCustom && (
        <div>
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Épreuves personnalisées
          </div>
          {customValues.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {customValues.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  {c}
                  <button type="button" onClick={() => onChange(value.filter((v) => v !== c))}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Ex : Cross régional"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addCustom}>
              <Plus className="size-3.5" />
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
