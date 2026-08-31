'use client'

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DISCIPLINE_CATEGORIES } from '@/lib/disciplines'
import { legibleAccent } from '@/lib/color-contrast'

const FALLBACK_COLOR = '#6366f1'
const CATEGORY_COLOR_BY_LABEL: Record<string, string> = Object.fromEntries(
  DISCIPLINE_CATEGORIES.map((c) => [c.label, c.color])
)

/**
 * Sélecteur multi-choix de disciplines, coloré par famille — même traitement
 * visuel que `GoalDisciplinePicker` (pastilles teintées par la couleur de la
 * famille en permanence, remplissage plus fort + anneau à la sélection),
 * décliné en multi-sélection pour les compétitions (§10 CLAUDE.md,
 * harmonisation 2026-08-25 : "comme objectif"). `groups` (optionnel) restreint
 * aux familles/épreuves déjà filtrées par `filterDisciplineGroups` (formulaire
 * d'inscription) — sinon toutes les familles standard sont proposées (couleur
 * de repli pour un groupe hors nomenclature, ex. "Personnalisées").
 */
export function DisciplinePicker({
  groups,
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

  const categories = groups
    ? Object.entries(groups).map(([label, disciplines]) => ({
        key: label,
        label,
        color: CATEGORY_COLOR_BY_LABEL[label] ?? FALLBACK_COLOR,
        disciplines,
      }))
    : DISCIPLINE_CATEGORIES

  const allCodes = categories.flatMap((c) => Object.values(c.disciplines))
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const codes = Object.values(category.disciplines)
          const allSelected = codes.length > 0 && codes.every((c) => value.includes(c))
          return (
            <div
              key={category.key}
              className="rounded-xl border p-3"
              style={{
                borderColor: `color-mix(in srgb, ${category.color} 25%, var(--border))`,
                backgroundColor: `color-mix(in srgb, ${category.color} 5%, transparent)`,
              }}
            >
              <div className="mb-2 flex items-center justify-between border-b border-dashed pb-1.5">
                <span
                  className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase"
                  style={{ color: legibleAccent(category.color) }}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: category.color }}
                  />
                  {category.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(codes)}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all"
                  style={
                    allSelected
                      ? {
                          backgroundColor: legibleAccent(category.color),
                          color: 'white',
                          borderColor: category.color,
                        }
                      : {
                          backgroundColor: `color-mix(in srgb, ${category.color} 10%, transparent)`,
                          color: `color-mix(in srgb, ${category.color} 85%, var(--foreground))`,
                          borderColor: `color-mix(in srgb, ${category.color} 30%, transparent)`,
                        }
                  }
                >
                  {allSelected && <Check className="size-2.5 shrink-0" strokeWidth={3} />}
                  Tous
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(category.disciplines).map(([label, code]) => {
                  const active = value.includes(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggle(code)}
                      className="inline-flex min-w-16 items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all"
                      style={
                        active
                          ? {
                              backgroundColor: legibleAccent(category.color),
                              color: 'white',
                              borderColor: category.color,
                              boxShadow: `0 2px 8px -2px color-mix(in srgb, ${category.color} 60%, transparent)`,
                            }
                          : {
                              backgroundColor: 'var(--card)',
                              color: `color-mix(in srgb, ${category.color} 85%, var(--foreground))`,
                              borderColor: `color-mix(in srgb, ${category.color} 30%, transparent)`,
                            }
                      }
                    >
                      {active && <Check className="size-3 shrink-0" strokeWidth={3} />}
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
        <div className="rounded-xl border border-dashed border-border p-3">
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
