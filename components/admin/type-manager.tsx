'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#ec4899',
  '#f472b6',
  '#ef4444',
  '#f87171',
  '#f59e0b',
  '#fb923c',
  '#facc15',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
]

export type ManagedType = { id: string; name: string; color: string; usageCount: number }

export function TypeManager({
  kind,
  initialTypes,
}: {
  kind: 'session' | 'competition'
  initialTypes: ManagedType[]
}) {
  const router = useRouter()
  const apiBase = kind === 'session' ? '/api/training-types' : '/api/competition-types'
  const label = kind === 'session' ? 'type de séance' : 'type de compétition'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [loading, setLoading] = useState(false)

  function startEdit(type: ManagedType) {
    setEditingId(type.id)
    setName(type.name)
    setColor(type.color)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setColor(PALETTE[0])
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch(editingId ? `${apiBase}/${editingId}` : apiBase, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Une erreur est survenue.')
      return
    }
    toast.success(editingId ? 'Type mis à jour.' : `Nouveau ${label} ajouté.`)
    resetForm()
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        `Supprimer ce ${label} ? Les séances/compétitions associées perdront ce type.`
      )
    )
      return
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Suppression impossible.')
      return
    }
    toast.success('Type supprimé.')
    if (editingId === id) resetForm()
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-3">
        {initialTypes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucun {label} pour le moment.
          </div>
        ) : (
          initialTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ background: type.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{type.name}</div>
                <div className="text-xs text-muted-foreground">
                  {type.usageCount} utilisation{type.usageCount > 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => startEdit(type)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Modifier"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => handleDelete(type.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">{editingId ? 'Modifier le type' : 'Nouveau type'}</h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Annuler l'édition"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="type-name">Nom</Label>
            <Input
              id="type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'session' ? 'Ex : Vitesse' : 'Ex : Meeting'}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="grid grid-cols-8 gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full border-2 transition-transform',
                    color === c
                      ? 'scale-110 border-foreground'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span
                className="size-3.5 rounded-full border border-border"
                style={{ background: color }}
              />
              {color}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading || !name.trim()} className="w-full">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingId ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  )
}
