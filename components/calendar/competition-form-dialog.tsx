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
import { TypePillPicker } from '@/components/calendar/type-pill-picker'

export type CompetitionTypeOption = { id: string; name: string; color: string }

export type CompetitionFormInitial = {
  title: string
  date: Date
  location: string | null
  competitionTypeId: string | null
  description: string | null
}

export function CompetitionFormDialog({
  open,
  onOpenChange,
  date,
  competitionTypes,
  competitionId,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  competitionTypes: CompetitionTypeOption[]
  competitionId?: string
  initialData?: CompetitionFormInitial
}) {
  const router = useRouter()
  const isEdit = !!competitionId
  const [title, setTitle] = useState('')
  const [competitionDate, setCompetitionDate] = useState('')
  const [location, setLocation] = useState('')
  const [competitionTypeId, setCompetitionTypeId] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setTitle(initialData.title)
      setCompetitionDate(toDateInputValue(initialData.date))
      setLocation(initialData.location ?? '')
      setCompetitionTypeId(initialData.competitionTypeId ?? undefined)
      setDescription(initialData.description ?? '')
    } else {
      setTitle('')
      setCompetitionDate(toDateInputValue(date ?? new Date()))
      setLocation('')
      setCompetitionTypeId(undefined)
      setDescription('')
    }
  }, [open, initialData, date])

  async function handleSubmit() {
    if (!title.trim() || !competitionDate) return
    setLoading(true)
    const res = await fetch(isEdit ? `/api/competitions/${competitionId}` : '/api/competitions', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: competitionDate,
        location: location || null,
        competitionTypeId: competitionTypeId ?? null,
        description: description || null,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEdit
          ? 'Impossible de mettre à jour la compétition.'
          : 'Impossible de créer la compétition.'
      )
      return
    }
    toast.success(isEdit ? 'Compétition mise à jour.' : 'Compétition créée.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? 'Modifier la compétition' : 'Nouvelle compétition'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="competition-title">Titre</Label>
            <Input
              id="competition-title"
              autoFocus
              className="h-11 text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Meeting régional indoor"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="competition-date">Date</Label>
              <Input
                id="competition-date"
                type="date"
                className="h-11"
                value={competitionDate}
                onChange={(e) => setCompetitionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competition-location">Lieu</Label>
              <Input
                id="competition-location"
                className="h-11"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex : Liévin"
              />
            </div>
          </div>

          <TypePillPicker
            label="Type"
            types={competitionTypes}
            value={competitionTypeId}
            onChange={setCompetitionTypeId}
          />

          <div className="space-y-1.5">
            <Label htmlFor="competition-description">Notes</Label>
            <Textarea
              id="competition-description"
              rows={16}
              className="min-h-64 resize-y text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes libres sur la compétition..."
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
