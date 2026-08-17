'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FeedbackType = 'bug' | 'suggestion'
type FeedbackStatus = 'new' | 'in_progress' | 'done'

export type FeedbackItem = {
  id: string
  type: FeedbackType
  description: string
  page: string | null
  status: FeedbackStatus
  authorName: string | null
  authorEmail: string | null
  adminNote: string | null
  createdAt: string
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  done: 'Résolu',
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
}

const TYPE_LABELS: Record<FeedbackType, string> = { bug: 'Bug 🐛', suggestion: 'Suggestion 💡' }
const TYPE_STYLES: Record<FeedbackType, string> = {
  bug: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  suggestion: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
}

export function FeedbacksPanel({ feedbacks: initial }: { feedbacks: FeedbackItem[] }) {
  const [feedbacks, setFeedbacks] = useState(initial)
  const [typeFilter, setTypeFilter] = useState<FeedbackType | null>(null)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return feedbacks.filter((f) => {
      if (typeFilter && f.type !== typeFilter) return false
      if (statusFilter && f.status !== statusFilter) return false
      if (
        q &&
        !`${f.description} ${f.authorName ?? ''} ${f.authorEmail ?? ''}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [feedbacks, typeFilter, statusFilter, search])

  async function updateStatus(id: string, status: FeedbackStatus) {
    const prev = feedbacks
    setFeedbacks((fs) => fs.map((f) => (f.id === id ? { ...f, status } : f)))
    const res = await fetch(`/api/feedbacks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      setFeedbacks(prev)
      toast.error('Impossible de mettre à jour le statut.')
    }
  }

  async function saveNote(id: string, adminNote: string) {
    const res = await fetch(`/api/feedbacks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: adminNote || null }),
    })
    if (!res.ok) {
      toast.error("Impossible d'enregistrer la note.")
      return
    }
    setFeedbacks((fs) => fs.map((f) => (f.id === id ? { ...f, adminNote: adminNote || null } : f)))
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer ce ticket ?')) return
    const prev = feedbacks
    setFeedbacks((fs) => fs.filter((f) => f.id !== id))
    const res = await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setFeedbacks(prev)
      toast.error('Suppression impossible.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!typeFilter && !statusFilter} onClick={() => {
          setTypeFilter(null)
          setStatusFilter(null)
        }}>
          Tous
        </FilterChip>
        <FilterChip active={typeFilter === 'bug'} onClick={() => setTypeFilter((t) => (t === 'bug' ? null : 'bug'))}>
          Bugs
        </FilterChip>
        <FilterChip
          active={typeFilter === 'suggestion'}
          onClick={() => setTypeFilter((t) => (t === 'suggestion' ? null : 'suggestion'))}
        >
          Suggestions
        </FilterChip>
        <span className="mx-1 w-px self-stretch bg-border" />
        <FilterChip
          active={statusFilter === 'new'}
          onClick={() => setStatusFilter((s) => (s === 'new' ? null : 'new'))}
        >
          Nouveaux
        </FilterChip>
        <FilterChip
          active={statusFilter === 'in_progress'}
          onClick={() => setStatusFilter((s) => (s === 'in_progress' ? null : 'in_progress'))}
        >
          En cours
        </FilterChip>
        <FilterChip
          active={statusFilter === 'done'}
          onClick={() => setStatusFilter((s) => (s === 'done' ? null : 'done'))}
        >
          Résolus
        </FilterChip>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans les descriptions…"
          className="pl-8"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aucun ticket ne correspond aux filtres.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              onStatus={(status) => updateStatus(f.id, status)}
              onSaveNote={(note) => saveNote(f.id, note)}
              onDelete={() => remove(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function FeedbackCard({
  feedback,
  onStatus,
  onSaveNote,
  onDelete,
}: {
  feedback: FeedbackItem
  onStatus: (status: FeedbackStatus) => void
  onSaveNote: (note: string) => void
  onDelete: () => void
}) {
  const [note, setNote] = useState(feedback.adminNote ?? '')
  const [showNote, setShowNote] = useState(!!feedback.adminNote)
  const [savingNote, setSavingNote] = useState(false)

  async function handleSaveNote() {
    setSavingNote(true)
    await onSaveNote(note)
    setSavingNote(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', TYPE_STYLES[feedback.type])}>
          {TYPE_LABELS[feedback.type]}
        </span>
        <span
          className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[feedback.status])}
        >
          {STATUS_LABELS[feedback.status]}
        </span>
        <span className="text-xs text-muted-foreground">
          {feedback.authorName ?? 'Utilisateur supprimé'}
          {feedback.authorEmail && ` · ${feedback.authorEmail}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {feedback.page && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {feedback.page}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm whitespace-pre-wrap">{feedback.description}</p>

      {showNote ? (
        <div className="mt-3 space-y-1.5">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note interne (visible admin uniquement)…"
            rows={2}
            className="text-xs"
          />
          <Button size="xs" variant="outline" onClick={handleSaveNote} disabled={savingNote}>
            Enregistrer la note
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          + Ajouter une note
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex gap-1.5">
          {(['new', 'in_progress', 'done'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatus(s)}
              disabled={feedback.status === s}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                feedback.status === s
                  ? cn(STATUS_STYLES[s], 'cursor-default')
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label="Supprimer">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
