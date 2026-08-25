'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { Bug, Check, Lightbulb, Loader2, Search, Swords, Trash2, Vote, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PublishPollDialog, type PollCandidate } from '@/components/admin/publish-poll-dialog'
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
  pollId: string | null
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  done: 'Résolu',
}

const STATUS_DOT: Record<FeedbackStatus, string> = {
  new: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
}

const TYPE_STYLES: Record<FeedbackType, { badge: string; accent: string }> = {
  bug: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30', accent: 'bg-rose-500' },
  suggestion: {
    badge: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
    accent: 'bg-violet-500',
  },
}

type TypeFilter = FeedbackType | null
type StatusFilterValue = FeedbackStatus | null

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: null, label: 'Tous' },
  { value: 'bug', label: 'Bugs' },
  { value: 'suggestion', label: 'Suggestions' },
]

const STATUS_TABS: { value: StatusFilterValue; label: string }[] = [
  { value: null, label: 'Tous' },
  { value: 'new', label: 'Nouveaux' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Résolus' },
]

export function FeedbacksPanel({ feedbacks: initial }: { feedbacks: FeedbackItem[] }) {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState(initial)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pollDialogOpen, setPollDialogOpen] = useState(false)

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

  const selectedCandidates: [PollCandidate, PollCandidate] | null =
    selectedIds.length === 2
      ? (selectedIds.map((id) => {
          const f = feedbacks.find((fb) => fb.id === id)!
          return { id: f.id, description: f.description }
        }) as [PollCandidate, PollCandidate])
      : null

  function toggleSelect(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((i) => i !== id)
      if (ids.length >= 2) {
        toast.info("Deux suggestions déjà sélectionnées — désélectionne-en une d'abord.")
        return ids
      }
      return [...ids, id]
    })
  }

  function handlePollDialogChange(next: boolean) {
    setPollDialogOpen(next)
    if (!next) setSelectedIds([])
  }

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
      return
    }
    // Invalide le cache de navigation de Next.js pour cette route : sans ça, revenir sur
    // /admin/feedbacks via un lien réaffiche l'ancien snapshot pré-modification.
    router.refresh()
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
    router.refresh()
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer ce ticket ?')) return
    const prev = feedbacks
    setFeedbacks((fs) => fs.filter((f) => f.id !== id))
    setSelectedIds((ids) => ids.filter((i) => i !== id))
    const res = await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setFeedbacks(prev)
      toast.error('Suppression impossible.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PillTabs
            value={typeFilter}
            tabs={TYPE_TABS}
            onChange={setTypeFilter}
            layoutId="feedback-type-filter"
          />
          <PillTabs
            value={statusFilter}
            tabs={STATUS_TABS}
            onChange={setStatusFilter}
            layoutId="feedback-status-filter"
          />
        </div>

        <div className="relative sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
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
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <Search className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun ticket ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              selected={selectedIds.includes(f.id)}
              selectionDisabled={selectedIds.length >= 2 && !selectedIds.includes(f.id)}
              onToggleSelect={() => toggleSelect(f.id)}
              onStatus={(status) => updateStatus(f.id, status)}
              onSaveNote={(note) => saveNote(f.id, note)}
              onDelete={() => remove(f.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-30 flex justify-center px-4 lg:bottom-6"
          >
            <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-xl shadow-black/10 dark:shadow-black/40">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedIds.length}/2 suggestion{selectedIds.length > 1 ? 's' : ''} sélectionnée
                {selectedIds.length > 1 ? 's' : ''}
              </span>
              <Button
                size="sm"
                disabled={selectedIds.length !== 2}
                onClick={() => setPollDialogOpen(true)}
              >
                <Swords className="size-4" />
                Confronter
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                aria-label="Annuler la sélection"
              >
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PublishPollDialog
        open={pollDialogOpen}
        onOpenChange={handlePollDialogChange}
        candidates={selectedCandidates}
      />
    </div>
  )
}

function PillTabs<T extends string | null>({
  value,
  tabs,
  onChange,
  layoutId,
}: {
  value: T
  tabs: { value: T; label: string }[]
  onChange: (v: T) => void
  layoutId: string
}) {
  return (
    <div className="no-scrollbar inline-flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
      {tabs.map((tab) => {
        const isActive = tab.value === value
        return (
          <button
            key={String(tab.value)}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function FeedbackCard({
  feedback,
  selected,
  selectionDisabled,
  onToggleSelect,
  onStatus,
  onSaveNote,
  onDelete,
}: {
  feedback: FeedbackItem
  selected: boolean
  selectionDisabled: boolean
  onToggleSelect: () => void
  onStatus: (status: FeedbackStatus) => void
  onSaveNote: (note: string) => void
  onDelete: () => void
}) {
  const [note, setNote] = useState(feedback.adminNote ?? '')
  const [showNote, setShowNote] = useState(!!feedback.adminNote)
  const [savingNote, setSavingNote] = useState(false)
  const [changingStatus, setChangingStatus] = useState<FeedbackStatus | null>(null)
  const TypeIcon = feedback.type === 'bug' ? Bug : Lightbulb

  async function handleSaveNote() {
    setSavingNote(true)
    await onSaveNote(note)
    setSavingNote(false)
  }

  function handleStatus(s: FeedbackStatus) {
    setChangingStatus(s)
    onStatus(s)
    setTimeout(() => setChangingStatus(null), 400)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors',
        selected ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', TYPE_STYLES[feedback.type].accent)} />

      <div className="p-4 pl-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
              TYPE_STYLES[feedback.type].badge
            )}
          >
            <TypeIcon className="size-3" />
            {feedback.type === 'bug' ? 'Bug' : 'Suggestion'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
              STATUS_STYLES[feedback.status]
            )}
          >
            <span className={cn('size-1.5 rounded-full', STATUS_DOT[feedback.status])} />
            {STATUS_LABELS[feedback.status]}
          </span>
          {feedback.page && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {feedback.page}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <p className="mt-2.5 text-xs text-muted-foreground">
          {feedback.authorName ?? 'Utilisateur supprimé'}
          {feedback.authorEmail && ` · ${feedback.authorEmail}`}
        </p>

        <p className="mt-2 text-sm whitespace-pre-wrap">{feedback.description}</p>

        {feedback.type === 'suggestion' && (
          <div className="mt-3">
            {feedback.pollId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-500">
                <Vote className="size-3.5" />
                Déjà utilisée dans un vote
              </span>
            ) : (
              <button
                type="button"
                onClick={onToggleSelect}
                disabled={selectionDisabled}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  selected
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {selected ? <Check className="size-3.5" /> : <Swords className="size-3.5" />}
                {selected ? 'Sélectionnée' : 'Sélectionner pour confronter'}
              </button>
            )}
          </div>
        )}

        {showNote ? (
          <div className="mt-3 space-y-1.5 rounded-xl bg-muted/40 p-2.5">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note interne (visible admin uniquement)…"
              rows={2}
              className="border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
            />
            <Button size="xs" variant="outline" onClick={handleSaveNote} disabled={savingNote}>
              {savingNote && <Loader2 className="size-3 animate-spin" />}
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
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            {(['new', 'in_progress', 'done'] as const).map((s) => {
              const isActive = feedback.status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatus(s)}
                  disabled={isActive}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                    isActive
                      ? cn(STATUS_STYLES[s], 'cursor-default shadow-sm')
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  )}
                >
                  {changingStatus === s ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    isActive && <Check className="size-3" />
                  )}
                  {STATUS_LABELS[s]}
                </button>
              )
            })}
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label="Supprimer">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}
