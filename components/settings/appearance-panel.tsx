'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, History, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Palette d'accent de la nouvelle interface — liste imposée par Maksen
// (2026-09-19), remplace l'ancienne roue de couleurs libre. "auto" (Blanc/
// Noir) est un cas particulier : ce n'est pas une couleur figée, elle est
// résolue selon le thème réel par components/new-ui/new-ui-root.tsx (blanc
// en thème sombre, noir en thème clair). Le violet de marque (#8A6BFF) reste
// la couleur par défaut quand aucune n'est choisie (fallback CSS dans
// globals.css) — volontairement absent de cette liste, il n'est pas un choix
// de personnalisation mais la base de l'app.
export const ACCENT_SWATCHES = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#22C55E', label: 'Vert' },
  { value: '#F97316', label: 'Orange' },
  { value: '#0EA5E9', label: 'Bleu ciel' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: 'auto', label: 'Blanc / Noir (selon le thème)' },
  { value: '#8B1E3F', label: 'Bordeaux / Pourpre' },
  { value: '#4C1D95', label: 'Violet foncé' },
  { value: '#14B8A6', label: 'Vert / Bleu' },
] as const

export const DEFAULT_ACCENT = '#8A6BFF'

export function AppearancePanel({
  isAdmin,
  initialNewUiEnabled,
  initialAccentColor,
}: {
  isAdmin: boolean
  initialNewUiEnabled: boolean
  initialAccentColor: string | null
}) {
  const router = useRouter()
  const [newUiEnabled, setNewUiEnabled] = useState(initialNewUiEnabled)
  const [accentColor, setAccentColor] = useState(initialAccentColor ?? DEFAULT_ACCENT)
  const [saving, setSaving] = useState<'ui' | 'color' | null>(null)

  async function save(patch: { newUiEnabled?: boolean; accentColor?: string }) {
    const res = await fetch('/api/users/me/appearance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      toast.error('Impossible d’enregistrer.')
      return false
    }
    router.refresh()
    return true
  }

  async function handleToggle(checked: boolean) {
    // Le switch affiche "Ancienne interface" côté UI — `checked` coché =
    // ancienne interface visible, donc `newUiEnabled: !checked` en base.
    const nextNewUiEnabled = !checked
    setNewUiEnabled(nextNewUiEnabled)
    setSaving('ui')
    const ok = await save({ newUiEnabled: nextNewUiEnabled })
    setSaving(null)
    if (!ok) setNewUiEnabled(!nextNewUiEnabled)
    else toast.success(checked ? 'Ancienne interface activée.' : 'Retour à la nouvelle interface.')
  }

  async function handlePickColor(value: string) {
    if (value === accentColor) return
    const prev = accentColor
    setAccentColor(value)
    setSaving('color')
    const ok = await save({ accentColor: value })
    setSaving(null)
    if (!ok) setAccentColor(prev)
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <History className="size-4.5" />
            </span>
            <div>
              <Label htmlFor="classic-ui-toggle" className="text-sm font-semibold">
                Ancienne interface
              </Label>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Réservé admin, pour comparer/dépanner. La nouvelle interface est celle de tout le
                club désormais — ce réglage n&apos;a aucun effet sur les autres comptes.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            {saving === 'ui' && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            <Switch id="classic-ui-toggle" checked={!newUiEnabled} onCheckedChange={handleToggle} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Couleur d&apos;accent</Label>
          {saving === 'color' && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          S&apos;applique à la nouvelle interface.
        </p>
        <div className="mt-3.5 flex flex-wrap gap-3">
          {ACCENT_SWATCHES.map((swatch) => {
            const selected = swatch.value.toLowerCase() === accentColor.toLowerCase()
            const isAuto = swatch.value === 'auto'
            return (
              <button
                key={swatch.value}
                type="button"
                aria-label={swatch.label}
                title={swatch.label}
                onClick={() => handlePickColor(swatch.value)}
                className={cn(
                  'flex size-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110',
                  selected ? 'ring-foreground' : 'ring-transparent',
                  isAuto && 'border border-border'
                )}
                style={
                  isAuto
                    ? { background: 'linear-gradient(135deg, #fff 50%, #0b0d10 50%)' }
                    : { backgroundColor: swatch.value }
                }
              >
                {selected && (
                  <Check
                    className={cn('size-4.5 drop-shadow', isAuto ? 'text-primary' : 'text-white')}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
