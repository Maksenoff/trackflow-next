'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { rpeColor, rpeLabel } from '@/lib/rpe'
import { cn } from '@/lib/utils'

export function RpeLogForm({
  sessionId,
  athleteId,
  initial,
  endpoint,
  method = 'POST',
}: {
  sessionId: string
  athleteId: string
  initial?: { difficulty: number | null; comment: string | null; skipped: boolean }
  /** Séance perso (`PATCH /api/athletes/[id]/custom-sessions/[csId]`) au lieu
   * d'une séance coach — même formulaire, même rendu, seul l'endpoint change. */
  endpoint?: string
  method?: 'POST' | 'PATCH'
}) {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 5)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [skipped, setSkipped] = useState(initial?.skipped ?? false)
  const [loading, setLoading] = useState(false)
  const color = rpeColor(difficulty)

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch(endpoint ?? `/api/sessions/${sessionId}/rpe`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athleteId,
        difficulty: skipped ? null : difficulty,
        comment: comment || null,
        skipped,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Impossible d’enregistrer ton ressenti.')
      return
    }
    toast.success(skipped ? 'Séance marquée comme non effectuée.' : 'Ressenti enregistré.')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold">
        {initial ? 'Modifier mon ressenti' : 'Comment s’est passée cette séance ?'}
      </h2>

      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          id="rpe-skipped"
          checked={skipped}
          onCheckedChange={(checked) => setSkipped(checked === true)}
        />
        <label htmlFor="rpe-skipped" className="cursor-pointer text-sm text-muted-foreground">
          Je n&apos;ai pas effectué cette séance
        </label>
      </div>

      {!skipped && (
        <div className="mb-4 space-y-3" style={{ '--rpe-color': color } as CSSProperties}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Difficulté ressentie (RPE)
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-sm font-extrabold"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {difficulty}/10 · {rpeLabel(difficulty)}
            </span>
          </div>
          <Slider
            value={[difficulty]}
            min={0}
            max={10}
            step={1}
            onValueChange={(v) => setDifficulty(Array.isArray(v) ? v[0] : v)}
            className="[&_[data-slot=slider-range]]:bg-[var(--rpe-color)] [&_[data-slot=slider-thumb]]:border-[var(--rpe-color)] [&_[data-slot=slider-thumb]]:ring-[var(--rpe-color)]/25 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:ring-4"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Un commentaire sur la séance (optionnel)..."
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className={cn('mt-4 w-full')}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {initial ? 'Mettre à jour' : 'Enregistrer mon ressenti'}
      </Button>
    </div>
  )
}
