'use client'

import { forwardRef, useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  notes: initialNotes,
  canEdit,
}: {
  athleteId: string
  notes: Note[]
  canEdit: boolean
}) {
  // État local optimiste : toute action (pin, suppression, création, édition) met à jour
  // cet état immédiatement, sans attendre le round-trip réseau — c'est ce qui rendait
  // l'onglet lent avant. Pas de router.refresh() après coup : ça re-render tout l'arbre
  // Server Component de la page et provoquait un flash visible ("la card se recharge") —
  // l'état local optimiste suffit, un vrai rechargement de page resynchronisera au besoin.
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => setNotes(initialNotes), [initialNotes])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)

  const pinned = notes.filter((n) => n.pinned)
  const others = notes.filter((n) => !n.pinned)
  const pinnedCount = pinned.length
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
    const saved = await res.json()
    if (isEditing) {
      setNotes((ns) => ns.map((n) => (n.id === editingId ? { ...n, title, content, color } : n)))
    } else {
      // La réponse JSON sérialise les dates en string — les dates des notes déjà en
      // props viennent de Prisma (via le Server Component) et sont de vraies Date.
      setNotes((ns) => [{ ...saved, createdAt: new Date(saved.createdAt), pinned: false }, ...ns])
    }
    resetForm()
    setDialogOpen(false)
  }

  async function togglePin(note: Note) {
    if (!note.pinned && pinnedCount >= MAX_PINNED) {
      toast.error(`Tu peux épingler ${MAX_PINNED} notes maximum. Désépingle-en une d'abord.`)
      return
    }
    const prev = notes
    setNotes((ns) => ns.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)))
    const res = await fetch(`/api/athletes/${athleteId}/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    if (!res.ok) {
      setNotes(prev)
      toast.error('Action impossible.')
    }
  }

  async function handleDelete(noteId: string) {
    const prev = notes
    setNotes((ns) => ns.filter((n) => n.id !== noteId))
    const res = await fetch(`/api/athletes/${athleteId}/notes/${noteId}`, { method: 'DELETE' })
    if (!res.ok) {
      setNotes(prev)
      toast.error('Suppression impossible.')
    }
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-3.5 transition-transform duration-300 group-hover:rotate-90" />
            Ajouter une note
          </button>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent
          className="overflow-hidden p-0 sm:max-w-md"
          showCloseButton={false}
          style={{ '--note-color': colorHex(color) } as CSSProperties}
        >
          <div
            className="relative overflow-hidden px-6 pt-6 pb-5"
            style={{
              background: `linear-gradient(135deg, ${colorHex(color)}26, transparent 65%)`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: 'var(--note-color)' }}
            />
            <DialogHeader className="p-0">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-colors"
                  style={{ backgroundColor: 'var(--note-color)' }}
                >
                  <StickyNote className="size-4.5 text-white" />
                </span>
                <DialogTitle className="text-base">
                  {!canEdit ? title : isEditing ? 'Modifier la note' : 'Nouvelle note'}
                </DialogTitle>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6 px-6 pt-2 pb-6">
            {canEdit && (
              <div className="space-y-2">
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
                          ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-popover'
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
                <Label htmlFor="note-title" className="text-sm font-semibold">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="note-title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Marque relais 4×100m, Réglages pointes..."
                  className="h-11 rounded-xl border-border bg-muted/40 px-3.5 shadow-sm transition-all focus-visible:border-[var(--note-color)] focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-[var(--note-color)]/15"
                />
              </div>
            )}

            <div className="space-y-1.5">
              {canEdit && (
                <Label htmlFor="note-content" className="text-sm font-semibold">
                  Note <span className="text-destructive">*</span>
                </Label>
              )}
              {canEdit ? (
                <Textarea
                  id="note-content"
                  rows={9}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ta note..."
                  className="min-h-48 resize-none rounded-xl border-border bg-muted/40 px-3.5 py-3 shadow-sm transition-all focus-visible:border-[var(--note-color)] focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-[var(--note-color)]/15"
                />
              ) : (
                <p className="max-h-96 overflow-y-auto text-sm whitespace-pre-line text-foreground">
                  {content}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="m-0 rounded-b-xl border-t border-border bg-muted/30 px-6 py-4">
            {canEdit ? (
              <>
                <DialogClose render={<Button variant="ghost">Annuler</Button>} />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !title.trim() || !content.trim()}
                  className="text-white shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--note-color)' }}
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm"
        >
          <StickyNote className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune note pour cet athlète.</p>
        </motion.div>
      ) : (
        <LayoutGroup>
          <div className="space-y-5">
            {pinned.length > 0 && (
              <NoteSection
                icon={Pin}
                label="Épinglées"
                count={pinned.length}
                accentColor={PIN_COLOR}
                notes={pinned}
                canEdit={canEdit}
                pinnedCount={pinnedCount}
                onOpen={openEdit}
                onTogglePin={togglePin}
                onDelete={handleDelete}
              />
            )}

            <NoteSection
              icon={StickyNote}
              label={pinned.length > 0 ? 'Toutes les notes' : 'Mes notes'}
              count={others.length}
              notes={others}
              canEdit={canEdit}
              pinnedCount={pinnedCount}
              onOpen={openEdit}
              onTogglePin={togglePin}
              onDelete={handleDelete}
            />
          </div>
        </LayoutGroup>
      )}
    </div>
  )
}

function NoteSection({
  icon: Icon,
  label,
  count,
  accentColor,
  notes,
  canEdit,
  pinnedCount,
  onOpen,
  onTogglePin,
  onDelete,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  count: number
  accentColor?: string
  notes: Note[]
  canEdit: boolean
  pinnedCount: number
  onOpen: (note: Note) => void
  onTogglePin: (note: Note) => void
  onDelete: (id: string) => void
}) {
  if (notes.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5" style={accentColor ? { color: accentColor } : undefined} />
        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
          {count}
        </span>
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              canEdit={canEdit}
              pinDisabled={!note.pinned && pinnedCount >= MAX_PINNED}
              onOpen={() => onOpen(note)}
              onTogglePin={() => onTogglePin(note)}
              onDelete={() => onDelete(note.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const NoteCard = forwardRef<
  HTMLDivElement,
  {
    note: Note
    canEdit: boolean
    pinDisabled: boolean
    onOpen: () => void
    onTogglePin: () => void
    onDelete: () => void
  }
>(function NoteCard({ note, canEdit, pinDisabled, onOpen, onTogglePin, onDelete }, ref) {
  const color = colorHex(note.color)

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={onOpen}
      className="group relative flex min-h-[200px] cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
    >
      <div className="h-1.5 shrink-0" style={{ background: color }} />

      {canEdit && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <DeleteNoteButton onDelete={onDelete} />
          <PinToggle pinned={note.pinned} disabled={pinDisabled} onClick={onTogglePin} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="pr-14 text-sm font-bold">{note.title}</div>
        <p className="mt-1.5 line-clamp-5 flex-1 text-sm whitespace-pre-line text-muted-foreground">
          {note.content}
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
          <span className="text-[11px] text-muted-foreground">
            {formatFullDate(note.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  )
})

/**
 * Toggle unique et toujours au même endroit (haut-droit de la card), pin ou pas —
 * cliquer l'icône elle-même épingle/désépingle, plus de bouton caché en bas.
 */
function PinToggle({
  pinned,
  disabled,
  onClick,
}: {
  pinned: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled && !pinned}
      className={cn(
        'flex size-6 items-center justify-center rounded-full bg-card/90 shadow-sm ring-1 ring-border transition-all',
        disabled && !pinned ? 'cursor-not-allowed text-muted-foreground/40' : 'hover:scale-105'
      )}
      style={
        pinned
          ? { backgroundColor: `${PIN_COLOR}22`, color: PIN_COLOR, boxShadow: 'none' }
          : undefined
      }
      title={pinned ? 'Désépingler' : disabled ? `${MAX_PINNED} notes épinglées max` : 'Épingler'}
    >
      <Pin
        className={cn('size-3.5', !pinned && 'text-muted-foreground')}
        fill={pinned ? PIN_COLOR : 'none'}
      />
    </motion.button>
  )
}

function DeleteNoteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex size-6 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </button>
        }
      />
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
