'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock, Loader2, Plus, Swords } from 'lucide-react'
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
import { cn } from '@/lib/utils'

// Format un Date en valeur locale pour <input type="datetime-local"> (toISOString()
// donnerait l'heure UTC, ce qui décale l'affichage par rapport à l'heure choisie).
// Même helper que publish-poll-dialog.tsx (duel "suggestions" staff) — ce
// composant gère lui le duel "libre" ouvert à tout utilisateur, création et
// modification (demande explicite de Maksen le 2026-08-29).
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export type PollFormInitial = {
  id: string
  startsAt: string
  expiresAt: string
  options: [{ id: string; label: string }, { id: string; label: string }]
}

export function PollFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PollFormInitial
}) {
  const router = useRouter()
  const isEdit = !!initial
  const [loading, setLoading] = useState(false)
  const [labelA, setLabelA] = useState('')
  const [labelB, setLabelB] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setLabelA(initial.options[0].label)
      setLabelB(initial.options[1].label)
      setStartsAt(toLocalInputValue(new Date(initial.startsAt)))
      setExpiresAt(toLocalInputValue(new Date(initial.expiresAt)))
    } else {
      setLabelA('')
      setLabelB('')
      const now = new Date()
      const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      setStartsAt(toLocalInputValue(now))
      setExpiresAt(toLocalInputValue(inOneWeek))
    }
  }, [open, initial])

  const startDate = startsAt ? new Date(startsAt) : null
  const endDate = expiresAt ? new Date(expiresAt) : null
  const rangeValid = !!startDate && !!endDate && endDate.getTime() > startDate.getTime()
  const canSubmit = !!labelA.trim() && !!labelB.trim() && rangeValid

  function extendByDays(days: number) {
    if (!endDate) return
    // Part de la date de fin actuelle du vote, sauf si le vote est déjà passé
    // (fin dans le passé) — dans ce cas part de maintenant, sinon "+7 jours"
    // sur un vote expiré depuis 2 semaines resterait dans le passé et ne le
    // repasserait pas actif (demande explicite de Maksen : pouvoir prolonger
    // un vote déjà passé pour le réactiver).
    const base = Math.max(endDate.getTime(), Date.now())
    setExpiresAt(toLocalInputValue(new Date(base + days * 24 * 60 * 60 * 1000)))
  }

  async function handleSubmit() {
    if (!canSubmit || !startDate || !endDate) return
    setLoading(true)

    const res = await fetch(isEdit ? `/api/polls/${initial.id}` : '/api/polls', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isEdit
          ? {
              startsAt: startDate.toISOString(),
              expiresAt: endDate.toISOString(),
              options: [
                { id: initial.options[0].id, label: labelA.trim() },
                { id: initial.options[1].id, label: labelB.trim() },
              ],
            }
          : {
              startsAt: startDate.toISOString(),
              expiresAt: endDate.toISOString(),
              options: [{ label: labelA.trim() }, { label: labelB.trim() }],
            }
      ),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error(isEdit ? 'Impossible de modifier ce vote.' : 'Impossible de créer ce vote.')
      return
    }
    toast.success(isEdit ? 'Vote mis à jour.' : 'Vote créé.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/30">
              <Swords className="size-4" />
            </span>
            {isEdit ? 'Modifier le vote' : 'Créer un vote'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <OptionField corner="blue" index={0} label={labelA} onChange={setLabelA} autoFocus />
            <div className="flex items-center justify-center py-1 sm:py-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-black text-muted-foreground shadow-sm">
                VS
              </span>
            </div>
            <OptionField corner="rose" index={1} label={labelB} onChange={setLabelB} />
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Durée du vote
              </div>
              {isEdit && (
                <div className="flex items-center gap-1">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => extendByDays(days)}
                      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="size-3" />
                      {days}j
                    </button>
                  ))}
                </div>
              )}
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
            {isEdit ? 'Enregistrer' : 'Créer le vote'}
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

function OptionField({
  corner,
  index,
  label,
  onChange,
  autoFocus,
}: {
  corner: 'blue' | 'rose'
  index: number
  label: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  const styles = CORNER_STYLES[corner]
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl border-2 p-3.5', styles.border, styles.bg)}>
      <span className={cn('text-[11px] font-bold tracking-wide uppercase', styles.eyebrow)}>
        Option {index + 1}
      </span>
      <Input
        autoFocus={autoFocus}
        placeholder="Ex: Maillot bleu…"
        value={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn('bg-card text-sm', styles.focusRing)}
      />
    </div>
  )
}
