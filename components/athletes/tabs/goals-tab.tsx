'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Target,
  Plus,
  CheckCircle2,
  XCircle,
  Circle,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatFullDate } from '@/lib/date'
import { disciplineUnit } from '@/lib/disciplines'
import { formatDiscipline, formatPerformanceValue } from '@/lib/performance'
import { GoalFormDialog } from '@/components/athletes/goal-form-dialog'
import type { AthleteDetail } from '@/lib/athletes-data'

type Goal = AthleteDetail['goals'][number]

const STATUS_CONFIG = {
  in_progress: { label: 'En cours', icon: Circle, className: 'text-primary' },
  achieved: {
    label: 'Atteint',
    icon: CheckCircle2,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  abandoned: { label: 'Abandonné', icon: XCircle, className: 'text-muted-foreground' },
} as const

export function GoalsTab({
  athleteId,
  goals,
  canEdit,
}: {
  athleteId: string
  goals: Goal[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(goal: Goal) {
    setEditing(goal)
    setFormOpen(true)
  }

  async function updateStatus(goalId: string, status: Goal['status']) {
    const res = await fetch(`/api/athletes/${athleteId}/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast.error('Mise à jour impossible.')
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!deleting) return
    const res = await fetch(`/api/athletes/${athleteId}/goals/${deleting.id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast.error("Impossible de supprimer l'objectif.")
      return
    }
    toast.success('Objectif supprimé.')
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Nouvel objectif
          </Button>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <Target className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun objectif défini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const config =
              STATUS_CONFIG[goal.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress
            const StatusIcon = config.icon
            const unit = goal.unit ?? (goal.discipline ? disciplineUnit(goal.discipline) : null)
            return (
              <div
                key={goal.id}
                className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon className={cn('size-4 shrink-0', config.className)} />
                    <span
                      className={cn(
                        'truncate text-sm font-semibold',
                        goal.status === 'abandoned' && 'text-muted-foreground line-through'
                      )}
                    >
                      {goal.title}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEdit(goal)}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Modifier"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(goal)}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {goal.discipline && (
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 font-semibold">
                      {formatDiscipline(goal.discipline)}
                    </span>
                  )}
                  {goal.targetValue != null && unit && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      Cible : {formatPerformanceValue(goal.targetValue, unit)}
                    </span>
                  )}
                  {goal.autoValidateFfa && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"
                      title="Validation automatique via FFA activée"
                    >
                      <RefreshCw className="size-3" />
                      Auto FFA
                    </span>
                  )}
                </div>

                {goal.deadline && (
                  <div className="text-xs text-muted-foreground">
                    Échéance : {formatFullDate(goal.deadline)}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-1 flex gap-1 border-t border-border pt-2.5">
                    {(['in_progress', 'achieved', 'abandoned'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(goal.id, s)}
                        className={cn(
                          'rounded-full px-2 py-1 text-[11px] font-semibold transition-colors',
                          goal.status === s
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {canEdit && (
        <GoalFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          athleteId={athleteId}
          initial={
            editing
              ? {
                  id: editing.id,
                  title: editing.title,
                  discipline: editing.discipline,
                  targetValue: editing.targetValue,
                  deadline: editing.deadline,
                  autoValidateFfa: editing.autoValidateFfa,
                }
              : undefined
          }
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet objectif ?</AlertDialogTitle>
            <AlertDialogDescription>
              &laquo;&nbsp;{deleting?.title}&nbsp;&raquo; sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
