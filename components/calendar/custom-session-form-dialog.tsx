'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
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
import { toDateInputValue } from '@/lib/calendar-grid'

export type CustomSessionFormInitial = {
  id: string
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  description: string | null
}

function toTimeInputValue(date: Date | null) {
  if (!date) return ''
  return date.toISOString().slice(11, 16)
}

/**
 * Création/édition d'une séance personnelle par l'athlète — délibérément sans
 * type ni coach (pas dans le programme du coach, cf. demande initiale) : juste
 * titre + date + heure + durée + programme. Le ressenti (debrief) se fait
 * depuis la fiche de la séance (/custom-sessions/[id]), pas ici.
 */
export function CustomSessionFormDialog({
  open,
  onOpenChange,
  athleteId,
  date,
  initialData,
  onSuccess,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  athleteId: string
  date: Date | null
  initialData?: CustomSessionFormInitial
  onSuccess?: () => void
  /** Appelé uniquement après une suppression réussie (jamais après un
   * enregistrement) — distinct d'`onSuccess` pour permettre à la fiche
   * séance de rediriger plutôt que de se rafraîchir sur une page 404. */
  onDeleted?: () => void
}) {
  const router = useRouter()
  const isEdit = !!initialData
  const [title, setTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setTitle(initialData.title)
      setSessionDate(toDateInputValue(initialData.date))
      setStartTime(toTimeInputValue(initialData.startTime))
      setDurationMinutes(initialData.durationMinutes ? String(initialData.durationMinutes) : '')
      setDescription(initialData.description ?? '')
    } else {
      setTitle('')
      setSessionDate(toDateInputValue(date ?? new Date()))
      setStartTime('')
      setDurationMinutes('')
      setDescription('')
    }
  }, [open, initialData, date])

  async function handleSubmit() {
    if (!title.trim() || !sessionDate) return
    setLoading(true)
    const res = await fetch(
      isEdit
        ? `/api/athletes/${athleteId}/custom-sessions/${initialData.id}`
        : `/api/athletes/${athleteId}/custom-sessions`,
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: sessionDate,
          startTime: startTime || null,
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          description: description || null,
        }),
      }
    )
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEdit ? 'Impossible de mettre à jour la séance.' : 'Impossible de créer la séance.'
      )
      return
    }
    toast.success(isEdit ? 'Séance mise à jour.' : 'Séance personnelle ajoutée.')
    onSuccess?.()
    onOpenChange(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!initialData) return
    setDeleting(true)
    const res = await fetch(`/api/athletes/${athleteId}/custom-sessions/${initialData.id}`, {
      method: 'DELETE',
    })
    setDeleting(false)
    if (!res.ok) {
      toast.error('Suppression impossible.')
      return
    }
    toast.success('Séance supprimée.')
    onSuccess?.()
    onDeleted?.()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? 'Modifier ma séance personnelle' : 'Nouvelle séance personnelle'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="custom-session-title">Titre</Label>
            <Input
              id="custom-session-title"
              autoFocus
              className="h-11 text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Footing perso, Gainage..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="custom-session-date">Date</Label>
              <Input
                id="custom-session-date"
                type="date"
                className="h-11"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-session-time">Heure</Label>
              <Input
                id="custom-session-time"
                type="time"
                className="h-11"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-session-duration">Durée (min)</Label>
              <Input
                id="custom-session-duration"
                type="number"
                min={0}
                className="h-11"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom-session-description">Programme</Label>
            <Textarea
              id="custom-session-description"
              rows={6}
              className="min-h-32 resize-y text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contenu de la séance (optionnel)..."
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {isEdit ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    <Trash2 className="size-4" />
                    Supprimer
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Le ressenti éventuellement enregistré sera aussi supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleting && <Loader2 className="size-4 animate-spin" />}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <DialogClose render={<Button variant="outline">Annuler</Button>} />
            <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
