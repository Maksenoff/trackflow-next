'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StickyNote, Plus, Pin, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { formatFullDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Note = AthleteDetail['notesList'][number]

const MAX_PINNED = 2
const PIN_COLOR = '#fbbf24'

const NOTE_COLORS: { key: string; hex: string }[] = [
  { key: '', hex: '#6366f1' },
  { key: 'violet', hex: '#a78bfa' },
  { key: 'sky', hex: '#38bdf8' },
  { key: 'teal', hex: '#2dd4bf' },
  { key: 'emerald', hex: '#34d399' },
  { key: 'lime', hex: '#a3e635' },
  { key: 'amber', hex: '#fbbf24' },
  { key: 'orange', hex: '#fb923c' },
  { key: 'rose', hex: '#f87171' },
  { key: 'pink', hex: '#f472b6' },
]

function colorHex(key: string) {
  return NOTE_COLORS.find((c) => c.key === key)?.hex ?? NOTE_COLORS[0].hex
}

export function NotesTab({
  athleteId,
  notes,
  canEdit,
}: {
  athleteId: string
  notes: Note[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)

  const pinnedCount = notes.filter((n) => n.pinned).length
  const isEditing = editingId !== null

  function resetForm() {
    setTitle('')
    setContent('')
    setColor('')
    setEditingId(null)
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(note: Note) {
    setEditingId(note.id)
    setTitle(note.title ?? '')
    setContent(note.content)
    setColor(note.color)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    const url = isEditing
      ? `/api/athletes/${athleteId}/notes/${editingId}`
      : `/api/athletes/${athleteId}/notes`
    const res = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, color }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEditing ? 'Impossible de mettre à jour la note.' : "Impossible d'ajouter la note."
      )
      return
    }
    resetForm()
    setDialogOpen(false)
    router.refresh()
  }

  async function togglePin(note: Note) {
    if (!note.pinned && pinnedCount >= MAX_PINNED) {
      toast.error(`Tu peux épingler ${MAX_PINNED} notes maximum. Désépingle-en une d'abord.`)
      return
    }
    const res = await fetch(`/api/athletes/${athleteId}/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    if (!res.ok) {
      toast.error('Action impossible.')
      return
    }
    router.refresh()
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm('Supprimer cette note ?')) return
    const res = await fetch(`/api/athletes/${athleteId}/notes/${noteId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Suppression impossible.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <button
          onClick={openCreate}
          className="flex w-full items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-primary shadow-sm hover:underline"
        >
          <Plus className="size-4" />
          Ajouter une note
        </button>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          style={{ borderLeft: `3px solid ${colorHex(color)}` }}
        >
          <DialogHeader>
            <DialogTitle>
              {!canEdit ? title : isEditing ? 'Modifier la note' : 'Nouvelle note'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {canEdit && (
              <div className="space-y-2.5">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={cn(
                        'size-7 rounded-full transition-transform',
                        color === c.key
                          ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-popover'
                          : 'hover:scale-105'
                      )}
                      style={{ background: c.hex }}
                      aria-label={c.key || 'Indigo'}
                    />
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="note-title">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="note-title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Marque relais 4×100m, Réglages pointes..."
                />
              </div>
            )}

            <div className="space-y-1.5">
              {canEdit && (
                <Label htmlFor="note-content">
                  Note <span className="text-destructive">*</span>
                </Label>
              )}
              {canEdit ? (
                <Textarea
                  id="note-content"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ta note..."
                />
              ) : (
                <p className="max-h-96 overflow-y-auto text-sm whitespace-pre-line text-foreground">
                  {content}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            {canEdit ? (
              <>
                <DialogClose render={<Button variant="ghost">Annuler</Button>} />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !title.trim() || !content.trim()}
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {isEditing ? 'Enregistrer' : 'Ajouter la note'}
                </Button>
              </>
            ) : (
              <DialogClose render={<Button variant="outline">Fermer</Button>} />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <StickyNote className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune note pour cet athlète.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Mes notes
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {notes.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {notes.map((note) => {
              const pinDisabled = !note.pinned && pinnedCount >= MAX_PINNED
              return (
                <div
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className="group relative cursor-pointer rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/40"
                  style={{ borderLeft: `3px solid ${colorHex(note.color)}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-sm font-bold">{note.title}</div>
                    {canEdit && (
                      <div className="ml-auto flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePin(note)
                          }}
                          disabled={pinDisabled}
                          className={cn(
                            'rounded-full p-1 transition-colors',
                            pinDisabled
                              ? 'cursor-not-allowed text-muted-foreground/40'
                              : note.pinned
                                ? ''
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                          style={note.pinned ? { color: PIN_COLOR } : undefined}
                          title={
                            note.pinned
                              ? 'Désépingler'
                              : pinDisabled
                                ? `${MAX_PINNED} notes épinglées max`
                                : 'Épingler'
                          }
                        >
                          <Pin className="size-3.5" fill={note.pinned ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(note.id)
                          }}
                          className="rounded-full p-1 text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-6 text-sm whitespace-pre-line text-muted-foreground">
                    {note.content}
                  </p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {formatFullDate(note.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
