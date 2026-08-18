'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock, Loader2, Swords } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Format un Date en valeur locale pour <input type="datetime-local"> (toISOString()
// donnerait l'heure UTC, ce qui décale l'affichage par rapport à l'heure choisie).
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export type PollCandidate = { id: string; description: string }

export function PublishPollDialog({
  open,
  onOpenChange,
  candidates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: [PollCandidate, PollCandidate] | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [labelA, setLabelA] = useState('')
  const [labelB, setLabelB] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (open) {
      setLabelA('')
      setLabelB('')
      const now = new Date()
      const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      setStartsAt(toLocalInputValue(now))
      setExpiresAt(toLocalInputValue(inOneWeek))
    }
  }, [open])

  const startDate = startsAt ? new Date(startsAt) : null
  const endDate = expiresAt ? new Date(expiresAt) : null
  const rangeValid = !!startDate && !!endDate && endDate.getTime() > startDate.getTime()
  const canSubmit = !!candidates && !!labelA.trim() && !!labelB.trim() && rangeValid

  async function handleSubmit() {
    if (!canSubmit || !candidates || !startDate || !endDate) return
    setLoading(true)

    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startsAt: startDate.toISOString(),
        expiresAt: endDate.toISOString(),
        options: [
          { feedbackId: candidates[0].id, label: labelA.trim() },
          { feedbackId: candidates[1].id, label: labelB.trim() },
        ],
      }),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error('Impossible de publier ce vote.')
      return
    }
    toast.success('Vote publié auprès de la communauté.')
    onOpenChange(false)
    router.refresh()
  }

  if (!candidates) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/30">
              <Swords className="size-4" />
            </span>
            Confronter deux suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <CandidateField
              corner="blue"
              index={0}
              original={candidates[0].description}
              label={labelA}
              onChange={setLabelA}
              autoFocus
            />
            <div className="flex items-center justify-center py-1 sm:py-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-black text-muted-foreground shadow-sm">
                VS
              </span>
            </div>
            <CandidateField
              corner="rose"
              index={1}
              original={candidates[1].description}
              label={labelB}
              onChange={setLabelB}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Durée du vote
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="poll-starts" className="text-xs">
                  Début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="poll-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="poll-expires" className="text-xs">
                  Fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="poll-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            {!rangeValid && startsAt && expiresAt && (
              <p className="text-xs text-destructive">
                La date de fin doit être après la date de début.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuler</Button>} />
          <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CORNER_STYLES = {
  blue: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    eyebrow: 'text-sky-500',
    focusRing: 'focus-visible:ring-sky-500/30 focus-visible:border-sky-500/50',
  },
  rose: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    eyebrow: 'text-rose-500',
    focusRing: 'focus-visible:ring-rose-500/30 focus-visible:border-rose-500/50',
  },
} as const

function CandidateField({
  corner,
  index,
  original,
  label,
  onChange,
  autoFocus,
}: {
  corner: 'blue' | 'rose'
  index: number
  original: string
  label: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  const styles = CORNER_STYLES[corner]
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl border-2 p-3.5', styles.border, styles.bg)}>
      <span className={cn('text-[11px] font-bold tracking-wide uppercase', styles.eyebrow)}>
        Suggestion {index + 1}
      </span>
      <p className="line-clamp-2 text-xs text-muted-foreground italic">{original}</p>
      <Textarea
        autoFocus={autoFocus}
        rows={3}
        placeholder="Reformulation courte…"
        value={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn('flex-1 resize-none bg-card text-sm', styles.focusRing)}
      />
    </div>
  )
}
