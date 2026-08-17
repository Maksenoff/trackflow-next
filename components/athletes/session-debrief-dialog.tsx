'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { rpeColor, rpeLabel } from '@/lib/rpe'
import { formatFullDate } from '@/lib/date'

export type DebriefSessionInfo = {
  id: string
  title: string
  date: Date
  trainingType: { name: string; color: string } | null
}

export function SessionDebriefDialog({
  open,
  onOpenChange,
  session,
  athleteId,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: DebriefSessionInfo | null
  athleteId: string
  initial?: { difficulty: number | null; comment: string | null; skipped: boolean } | null
}) {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<'save' | 'skip' | null>(null)

  useEffect(() => {
    if (!open) return
    setDifficulty(initial?.difficulty ?? 5)
    setComment(initial?.comment ?? '')
  }, [open, initial])

  if (!session) return null
  const color = rpeColor(difficulty)
  const isEditing = initial != null && (initial.difficulty !== null || initial.skipped)

  async function submit(skipped: boolean) {
    if (!session) return
    setLoading(skipped ? 'skip' : 'save')
    const res = await fetch(`/api/sessions/${session.id}/rpe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athleteId,
        difficulty: skipped ? null : difficulty,
        comment: comment || null,
        skipped,
      }),
    })
    setLoading(null)
    if (!res.ok) {
      toast.error('Impossible d’enregistrer ton ressenti.')
      return
    }
    toast.success(skipped ? 'Séance marquée comme non effectuée.' : 'Ressenti enregistré.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
        <div className="h-1.5" style={{ background: color }} />

        <div className="p-5 sm:p-6">
          <div className="mb-5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold">{session.title}</h2>
              {session.trainingType && (
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${session.trainingType.color}22`,
                    color: session.trainingType.color,
                    borderColor: `${session.trainingType.color}44`,
                  }}
                >
                  {session.trainingType.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{formatFullDate(session.date)}</p>
          </div>

          <h3 className="mb-4 text-sm font-bold">
            {isEditing ? 'Modifier le ressenti' : 'Comment s’est passée cette séance ?'}
          </h3>

          <div
            className="mb-5 space-y-3"
            style={{ '--rpe-color': color } as CSSProperties}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Difficulté ressentie
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-sm font-extrabold"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {rpeLabel(difficulty)} {difficulty}/10
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
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Repos</span>
              <span>Modéré</span>
              <span>Maximum</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="debrief-comment" className="text-sm font-medium text-muted-foreground">
              Ressenti / Commentaire
            </label>
            <Textarea
              id="debrief-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Un commentaire sur la séance (optionnel)..."
            />
          </div>

          <Button
            onClick={() => submit(false)}
            disabled={loading !== null}
            className="mt-5 w-full text-white shadow-lg"
            style={{ background: color, boxShadow: `0 8px 20px -6px ${color}66` }}
          >
            {loading === 'save' && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </Button>

          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="hover:text-foreground hover:underline"
            >
              Annuler
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={loading !== null}
              className="hover:text-destructive hover:underline"
            >
              {loading === 'skip' ? 'Enregistrement...' : "Je n'ai pas fait cette séance"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
