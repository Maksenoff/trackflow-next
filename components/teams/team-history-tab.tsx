'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Timer, MapPin, Medal, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddTeamPerformanceDialog } from './add-team-performance-dialog'
import type { TeamPerformanceEntry } from '@/lib/teams-data'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TeamHistoryTab({
  teamId,
  performances,
  canManage,
}: {
  teamId: string
  performances: TeamPerformanceEntry[]
  canManage: boolean
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TeamPerformanceEntry | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(p: TeamPerformanceEntry) {
    setEditing(p)
    setDialogOpen(true)
  }

  async function removePerformance(id: string) {
    setRemovingId(id)
    const res = await fetch(`/api/teams/${teamId}/performances/${id}`, { method: 'DELETE' })
    setRemovingId(null)
    if (!res.ok) {
      toast.error('Impossible de supprimer.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {performances.length} performance{performances.length > 1 ? 's' : ''}
        </p>
        {canManage && (
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="size-4" />
            Ajouter
          </Button>
        )}
      </div>

      {performances.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
          <Timer className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune performance enregistrée.</p>
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {performances.map((p) => (
            <motion.div
              key={p.id}
              variants={itemVariants}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Timer className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-bold">{p.time}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{formatDate(p.date)}</span>
                  {p.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {p.location}
                    </span>
                  )}
                </div>
              </div>
              {p.place != null && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Medal className="size-3.5" />
                  {p.place}
                  <sup>{p.place === 1 ? 'er' : 'e'}</sup>
                </span>
              )}
              {canManage && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label="Modifier"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePerformance(p.id)}
                    disabled={removingId === p.id}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {canManage && (
        <AddTeamPerformanceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          teamId={teamId}
          performance={editing}
        />
      )}
    </div>
  )
}
