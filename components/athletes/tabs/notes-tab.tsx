'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { StickyNote, Plus, Pin, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatFullDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type Note = AthleteDetail['notesList'][number]

const NOTE_COLORS: { key: string; hex: string }[] = [
  { key: '', hex: '#6366f1' },
  { key: 'emerald', hex: '#34d399' },
  { key: 'amber', hex: '#fbbf24' },
  { key: 'rose', hex: '#f87171' },
  { key: 'violet', hex: '#a78bfa' },
  { key: 'sky', hex: '#38bdf8' },
  { key: 'orange', hex: '#fb923c' },
  { key: 'pink', hex: '#f472b6' },
  { key: 'teal', hex: '#2dd4bf' },
  { key: 'lime', hex: '#a3e635' },
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
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!content.trim()) return
    setLoading(true)
    const res = await fetch(`/api/athletes/${athleteId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, color }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error("Impossible d'ajouter la note.")
      return
    }
    setContent('')
    setColor('')
    setShowForm(false)
    router.refresh()
  }

  async function togglePin(note: Note) {
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
    <div className="space-y-3">
      {canEdit && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {showForm ? (
            <div className="space-y-3">
              <Textarea
                autoFocus
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écris une note..."
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={cn(
                        'size-5 rounded-full border-2 transition-transform',
                        color === c.key
                          ? 'scale-110 border-foreground'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="size-4" />
              Ajouter une note
            </button>
          )}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <StickyNote className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune note pour cet athlète.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border-l-4 border border-border bg-card p-4 shadow-sm"
              style={{ borderLeftColor: colorHex(note.color) }}
            >
              <div className="flex items-start justify-between gap-2">
                {note.title && <div className="text-sm font-bold">{note.title}</div>}
                {canEdit && (
                  <div className="ml-auto flex shrink-0 gap-1">
                    <button
                      onClick={() => togglePin(note)}
                      className={cn(
                        'rounded-full p-1 transition-colors hover:bg-muted',
                        note.pinned ? 'text-primary' : 'text-muted-foreground'
                      )}
                      title={note.pinned ? 'Désépingler' : 'Épingler'}
                    >
                      <Pin className="size-3.5" fill={note.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                {note.content}
              </p>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {formatFullDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
