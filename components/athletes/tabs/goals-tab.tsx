'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Target,
  CheckCircle2,
  PauseCircle,
  Circle,
  RefreshCw,
  Pencil,
  Trash2,
  CalendarDays,
  Lock,
} from 'lucide-react'
import { AddTile } from '@/components/ui/add-tile'
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
import { disciplineUnit, goalDisciplineColor } from '@/lib/disciplines'
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
  abandoned: { label: 'En pause', icon: PauseCircle, className: 'text-muted-foreground' },
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
      {!canEdit && goals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <Target className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun objectif défini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {canEdit && <AddTile label="+ Objectif" onClick={openCreate} />}
          {goals.map((goal) => {
            const config =
              STATUS_CONFIG[goal.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress
            const StatusIcon = config.icon
            const unit = goal.unit ?? (goal.discipline ? disciplineUnit(goal.discipline) : null)
            const color = goal.discipline ? goalDisciplineColor(goal.discipline) : null

            return (
              <div
                key={goal.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-4.5"
                style={color ? { borderLeftWidth: 3, borderLeftColor: color } : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
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
                        className="touch-target flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Modifier"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(goal)}
                        className="touch-target flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {(goal.discipline || goal.autoValidateFfa) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {goal.discipline && color && (
                      <span
                        className="rounded-full border px-2 py-0.5 font-semibold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                          color,
                          borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                        }}
                      >
                        {formatDiscipline(goal.discipline)}
                      </span>
                    )}
                    {goal.targetValue != null && unit && color && (
                      <span
                        className="rounded-full border px-2 py-0.5 font-semibold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
                          color,
                          borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                        }}
                      >
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
                )}

                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" />
                    Échéance : {formatFullDate(goal.deadline)}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-auto space-y-1.5 border-t border-border pt-2.5">
                    {goal.autoValidateFfa && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Lock className="size-3 shrink-0" />
                        Géré automatiquement via FFA
                      </div>
                    )}
                    <div
                      className="grid grid-cols-3 gap-1"
                      style={{ '--tint': color ?? 'var(--primary)' } as React.CSSProperties}
                    >
                      {(['in_progress', 'achieved', 'abandoned'] as const).map((s) => {
                        const active = goal.status === s
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={goal.autoValidateFfa}
                            onClick={() => updateStatus(goal.id, s)}
                            className={cn(
                              'touch-target rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors',
                              goal.autoValidateFfa
                                ? !active && 'text-muted-foreground/50'
                                : !active &&
                                    'text-muted-foreground hover:[background-color:color-mix(in_srgb,var(--tint)_10%,transparent)] hover:[color:var(--tint)]'
                            )}
                            style={
                              active
                                ? {
                                    backgroundColor: `color-mix(in srgb, var(--tint) 15%, transparent)`,
                                    color: 'var(--tint)',
                                  }
                                : undefined
                            }
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        )
                      })}
                    </div>
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
