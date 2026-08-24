'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { GoalDisciplinePicker } from '@/components/athletes/goal-discipline-picker'
import { disciplineUnit } from '@/lib/disciplines'
import { seasonEndDate, formatDiscipline } from '@/lib/performance'
import { toDateInputValue } from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'

export type GoalFormInitial = {
  id: string
  title: string
  discipline: string | null
  targetValue: number | null
  deadline: Date | null
  autoValidateFfa: boolean
}

const UNIT_LABEL: Record<string, string> = {
  s: 'Temps (secondes)',
  m: 'Distance (m)',
  pts: 'Points',
}

export function GoalFormDialog({
  open,
  onOpenChange,
  athleteId,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  athleteId: string
  initial?: GoalFormInitial
}) {
  const router = useRouter()
  const isEdit = !!initial
  const [title, setTitle] = useState('')
  const [discipline, setDiscipline] = useState<string | null>(null)
  const [targetValue, setTargetValue] = useState('')
  const [deadlineMode, setDeadlineMode] = useState<'none' | 'date' | 'season'>('none')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [autoValidateFfa, setAutoValidateFfa] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title)
      setDiscipline(initial.discipline)
      setTargetValue(initial.targetValue != null ? String(initial.targetValue) : '')
      setDeadlineDate(initial.deadline ? toDateInputValue(initial.deadline) : '')
      setDeadlineMode(initial.deadline ? 'date' : 'none')
      setAutoValidateFfa(initial.autoValidateFfa)
    } else {
      setTitle('')
      setDiscipline(null)
      setTargetValue('')
      setDeadlineMode('none')
      setDeadlineDate('')
      setAutoValidateFfa(false)
    }
  }, [open, initial])

  const unit = discipline ? disciplineUnit(discipline) : null

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)

    const deadline =
      deadlineMode === 'season'
        ? seasonEndDate(new Date()).toISOString()
        : deadlineMode === 'date' && deadlineDate
          ? new Date(deadlineDate).toISOString()
          : null

    const res = await fetch(
      isEdit
        ? `/api/athletes/${athleteId}/goals/${initial.id}`
        : `/api/athletes/${athleteId}/goals`,
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          discipline,
          targetValue: targetValue ? Number(targetValue) : null,
          unit,
          deadline,
          autoValidateFfa,
        }),
      }
    )
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEdit ? "Impossible de mettre à jour l'objectif." : "Impossible d'ajouter l'objectif."
      )
      return
    }
    toast.success(isEdit ? 'Objectif mis à jour.' : 'Objectif créé.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Modifier l'objectif" : 'Nouvel objectif'}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto py-1">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Titre</Label>
            <Input
              id="goal-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Passer sous les 12'' au 100m"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Discipline</Label>
            <GoalDisciplinePicker value={discipline} onChange={setDiscipline} />
          </div>

          {discipline && (
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">{UNIT_LABEL[unit ?? 's']}</Label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min={0}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={unit === 's' ? 'Ex : 11.85' : 'Ex : 6.20'}
              />
            </div>
          )}

          {discipline && targetValue && (
            <label className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-3.5">
              <Checkbox
                checked={autoValidateFfa}
                onCheckedChange={(checked) => setAutoValidateFfa(checked === true)}
                className="mt-0.5"
              />
              <span className="text-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <RefreshCw className="size-3.5 text-primary" />
                  Validation automatique via FFA
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  Dès qu&apos;une performance en {formatDiscipline(discipline)} synchronisée depuis
                  athle.fr après la création de l&apos;objectif dépasse la cible, il passe
                  automatiquement en &laquo;&nbsp;Atteint&nbsp;&raquo;.
                </span>
              </span>
            </label>
          )}

          <div className="space-y-1.5">
            <Label>Échéance</Label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: 'none', label: 'Aucune' },
                  { key: 'date', label: 'Date précise' },
                  { key: 'season', label: 'Fin de saison' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDeadlineMode(opt.key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    deadlineMode === opt.key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {deadlineMode === 'date' && (
              <Input
                type="date"
                className="mt-2"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            )}
            {deadlineMode === 'season' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Échéance fixée au 31/08/{seasonEndDate(new Date()).getFullYear()}.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
