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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toDateInputValue } from '@/lib/calendar-grid'

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la séance' : 'Nouvelle séance'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Titre</Label>
            <Input
              id="session-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Séance sprint court"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-time">Heure</Label>
              <Input
                id="session-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-duration">Durée (min)</Label>
            <Input
              id="session-duration"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={trainingTypeId} onValueChange={(v) => setTrainingTypeId(v ?? undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucun type">
                  {(value: string | null) =>
                    trainingTypes.find((t) => t.id === value)?.name ?? 'Aucun type'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {trainingTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-description">Programme</Label>
            <Textarea
              id="session-description"
              rows={3}
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
