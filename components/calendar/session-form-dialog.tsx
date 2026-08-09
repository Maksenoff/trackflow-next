'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { toDateInputValue } from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'

export type TrainingTypeOption = { id: string; name: string; color: string }

export type SessionFormInitial = {
  title: string
  date: Date
  startTime: Date | null
  durationMinutes: number | null
  trainingTypeId: string | null
  description: string | null
}

function toTimeInputValue(date: Date | null) {
  if (!date) return ''
  return date.toISOString().slice(11, 16)
}

export function SessionFormDialog({
  open,
  onOpenChange,
  date,
  trainingTypes,
  sessionId,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  trainingTypes: TrainingTypeOption[]
  sessionId?: string
  initialData?: SessionFormInitial
}) {
  const router = useRouter()
  const isEdit = !!sessionId
  const [title, setTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [trainingTypeId, setTrainingTypeId] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setTitle(initialData.title)
      setSessionDate(toDateInputValue(initialData.date))
      setStartTime(toTimeInputValue(initialData.startTime))
      setDurationMinutes(initialData.durationMinutes ? String(initialData.durationMinutes) : '')
      setTrainingTypeId(initialData.trainingTypeId ?? undefined)
      setDescription(initialData.description ?? '')
    } else {
      setTitle('')
      setSessionDate(toDateInputValue(date ?? new Date()))
      setStartTime('')
      setDurationMinutes('')
      setTrainingTypeId(undefined)
      setDescription('')
    }
  }, [open, initialData, date])

  async function handleSubmit() {
    if (!title.trim() || !sessionDate) return
    setLoading(true)
    const res = await fetch(isEdit ? `/api/sessions/${sessionId}` : '/api/sessions', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: sessionDate,
        startTime: startTime || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        trainingTypeId: trainingTypeId ?? null,
        description: description || null,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEdit ? 'Impossible de mettre à jour la séance.' : 'Impossible de créer la séance.'
      )
      return
    }
    toast.success(isEdit ? 'Séance mise à jour.' : 'Séance créée.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? 'Modifier la séance' : 'Nouvelle séance'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Titre</Label>
            <Input
              id="session-title"
              autoFocus
              className="h-11 text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Séance sprint court"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                className="h-11"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-time">Heure</Label>
              <Input
                id="session-time"
                type="time"
                className="h-11"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-duration">Durée (min)</Label>
              <Input
                id="session-duration"
                type="number"
                min={0}
                className="h-11"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTrainingTypeId(undefined)}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                  !trainingTypeId
                    ? 'border-foreground/25 bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                )}
              >
                Aucun type
              </button>
              {trainingTypes.map((t) => {
                const active = trainingTypeId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrainingTypeId(t.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                      active ? 'shadow-sm' : 'border-border text-muted-foreground hover:bg-muted/50'
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${t.color}22`,
                            color: t.color,
                            borderColor: `${t.color}66`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: t.color }}
                    />
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-description">Programme</Label>
            <Textarea
              id="session-description"
              rows={16}
              className="min-h-64 resize-y text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contenu de la séance..."
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
