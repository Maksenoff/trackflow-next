'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Target, Plus, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatFullDate } from '@/lib/date'
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
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch(`/api/athletes/${athleteId}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error("Impossible d'ajouter l'objectif.")
      return
    }
    setTitle('')
    setShowForm(false)
    router.refresh()
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

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {showForm ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'objectif..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="sm:flex-1"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleCreate} disabled={loading} className="flex-1 sm:flex-none">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : 'Ajouter'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="flex-1 sm:flex-none"
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="size-4" />
              Ajouter un objectif
            </button>
          )}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <Target className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun objectif défini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {goals.map((goal) => {
            const config =
              STATUS_CONFIG[goal.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress
            const StatusIcon = config.icon
            return (
              <div
                key={goal.id}
                className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
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
                  {(goal.discipline || goal.deadline) && (
                    <div className="mt-0.5 ml-6 text-xs text-muted-foreground">
                      {goal.discipline}
                      {goal.discipline && goal.deadline && ' · '}
                      {goal.deadline && `avant le ${formatFullDate(goal.deadline)}`}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
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
    </div>
  )
}
