'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { rpeColor } from '@/lib/rpe'
import { formatFullDate } from '@/lib/date'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { legibleAccent } from '@/lib/color-contrast'

export type DebriefCompetitionInfo = {
  id: string
  registrationId: string
  title: string
  date: Date
  competitionType: { name: string; color: string } | null
  disciplines: string[]
}

function feelingColor(v: number): string {
  return rpeColor(10 - v)
}

function feelingLabel(v: number): string {
  if (v <= 2) return 'Déçu(e)'
  if (v <= 4) return 'Mitigé(e)'
  if (v <= 6) return 'Satisfait(e)'
  if (v <= 8) return 'Content(e)'
  return 'Excellent(e)'
}

export function CompetitionDebriefDialog({
  open,
  onOpenChange,
  competition,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  competition: DebriefCompetitionInfo | null
  initial?: { feeling: number | null; notes: string | null; skipped: boolean } | null
}) {
  const router = useRouter()
  const [feeling, setFeeling] = useState(5)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<'save' | 'skip' | null>(null)

  useEffect(() => {
    if (!open) return
    setFeeling(initial?.feeling ?? 5)
    setNotes(initial?.notes ?? '')
  }, [open, initial])

  if (!competition) return null
  const color = feelingColor(feeling)

  async function submit(skipped: boolean) {
    if (!competition) return
    setLoading(skipped ? 'skip' : 'save')
    const res = await fetch(
      `/api/competitions/${competition.id}/registrations/${competition.registrationId}/debrief`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeling: skipped ? null : feeling,
          notes: notes || null,
          skipped,
        }),
      }
    )
    setLoading(null)
    if (!res.ok) {
      toast.error('Impossible d’enregistrer ton ressenti.')
      return
    }
    toast.success(skipped ? 'Compétition marquée comme non disputée.' : 'Ressenti enregistré.')
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
              <h2 className="text-base font-bold">{competition.title}</h2>
              {competition.competitionType && (
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${competition.competitionType.color}22`,
                    color: legibleAccent(competition.competitionType.color),
                    borderColor: `${competition.competitionType.color}44`,
                  }}
                >
                  {competition.competitionType.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{formatFullDate(competition.date)}</p>
            {competition.disciplines.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {competition.disciplines.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[10px]">
                    {DISCIPLINE_LABELS[d] ?? d}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <h3 className="mb-4 text-sm font-bold">
            {initial != null && (initial.feeling !== null || initial.skipped)
              ? 'Modifier le ressenti'
              : 'Comment s’est passée cette compétition ?'}
          </h3>

          <div className="mb-5 space-y-3" style={{ '--rpe-color': color } as CSSProperties}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Ressenti général</span>
              <span
                className="rounded-full px-2.5 py-1 text-sm font-extrabold"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {feelingLabel(feeling)} {feeling}/10
              </span>
            </div>
            <Slider
              value={[feeling]}
              min={0}
              max={10}
              step={1}
              onValueChange={(v) => setFeeling(Array.isArray(v) ? v[0] : v)}
              className="[&_[data-slot=slider-range]]:bg-[var(--rpe-color)] [&_[data-slot=slider-thumb]]:border-[var(--rpe-color)] [&_[data-slot=slider-thumb]]:ring-[var(--rpe-color)]/25 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:ring-4"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Déçu(e)</span>
              <span>Satisfait(e)</span>
              <span>Excellent(e)</span>
            </div>
          </div>

          {/* Le résultat sera pré-rempli automatiquement via le scraping FFA (à venir) */}
          <div className="space-y-1.5">
            <label
              htmlFor="competition-debrief-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Ressenti / Commentaire
            </label>
            <Textarea
              id="competition-debrief-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment tu as vécu cette compétition (optionnel)..."
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
              {loading === 'skip' ? 'Enregistrement...' : "Je n'ai pas disputé cette compétition"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
