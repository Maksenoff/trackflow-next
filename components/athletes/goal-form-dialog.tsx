'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Hand, Ban, CalendarDays, GraduationCap } from 'lucide-react'
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
import { GoalDisciplinePicker } from '@/components/athletes/goal-discipline-picker'
import { disciplineUnit, goalDisciplineColor } from '@/lib/disciplines'
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

const DEADLINE_OPTIONS = [
  { key: 'none' as const, label: 'Aucune', icon: Ban },
  { key: 'date' as const, label: 'Date précise', icon: CalendarDays },
  { key: 'season' as const, label: 'Fin de saison', icon: GraduationCap },
]

const VALIDATION_OPTIONS = [
  { key: false, label: 'Manuelle', icon: Hand },
  { key: true, label: 'Automatique (FFA)', icon: RefreshCw },
]

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
  const color = discipline ? goalDisciplineColor(discipline) : 'var(--primary)'

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
          autoValidateFfa: targetValue ? autoValidateFfa : false,
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Modifier l'objectif" : 'Nouvel objectif'}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[80vh] space-y-5 overflow-y-auto py-1">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
            <div className="space-y-1.5 sm:col-span-3">
              <Label>Discipline</Label>
              <GoalDisciplinePicker value={discipline} onChange={setDiscipline} />
            </div>

            <div className="space-y-5 sm:col-span-2">
              <AnimatePresence initial={false}>
                {discipline && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-5 overflow-hidden"
                  >
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
                        className="border-2"
                        style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {targetValue && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <Label>Validation</Label>
                          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/40 p-1.5">
                            {VALIDATION_OPTIONS.map((opt) => {
                              const active = autoValidateFfa === opt.key
                              return (
                                <button
                                  key={String(opt.key)}
                                  type="button"
                                  onClick={() => setAutoValidateFfa(opt.key)}
                                  className={cn(
                                    'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-colors',
                                    active
                                      ? 'bg-gradient-selected text-white shadow-sm shadow-primary/25'
                                      : 'text-muted-foreground hover:bg-card'
                                  )}
                                >
                                  <opt.icon className="size-4" />
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                          {autoValidateFfa && (
                            <p className="text-xs text-muted-foreground">
                              Dès qu&apos;une performance en {formatDiscipline(discipline)}{' '}
                              synchronisée depuis athle.fr après la création dépasse la cible,
                              l&apos;objectif passe automatiquement en
                              &laquo;&nbsp;Atteint&nbsp;&raquo;.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label>Échéance</Label>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-muted/40 p-1.5">
                  {DEADLINE_OPTIONS.map((opt) => {
                    const active = deadlineMode === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setDeadlineMode(opt.key)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-colors',
                          active
                            ? 'bg-gradient-selected text-white shadow-sm shadow-primary/25'
                            : 'text-muted-foreground hover:bg-card'
                        )}
                      >
                        <opt.icon className="size-4" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {deadlineMode === 'date' && (
                    <motion.div
                      key="date"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                      />
                    </motion.div>
                  )}
                  {deadlineMode === 'season' && (
                    <motion.div
                      key="season"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary"
                    >
                      <GraduationCap className="size-4 shrink-0" />
                      Échéance fixée au 31/08/{seasonEndDate(new Date()).getFullYear()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
