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
import type { TeamPerformanceEntry } from '@/lib/teams-data'

function toDateInput(date: Date) {
  return new Date(date).toISOString().slice(0, 10)
}

export function AddTeamPerformanceDialog({
  open,
  onOpenChange,
  teamId,
  performance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  /** Fourni = mode édition, absent = mode création. */
  performance?: TeamPerformanceEntry | null
}) {
  const router = useRouter()
  const isEdit = !!performance
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [place, setPlace] = useState('')

  useEffect(() => {
    if (!open) return
    if (performance) {
      setTime(performance.time)
      setLocation(performance.location ?? '')
      setDate(toDateInput(performance.date))
      setPlace(performance.place != null ? String(performance.place) : '')
    } else {
      setTime('')
      setLocation('')
      setDate(new Date().toISOString().slice(0, 10))
      setPlace('')
    }
  }, [open, performance])

  async function handleSubmit() {
    if (!time.trim() || !date) return
    setLoading(true)
    const url = isEdit
      ? `/api/teams/${teamId}/performances/${performance!.id}`
      : `/api/teams/${teamId}/performances`
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time: time.trim(),
        location: location.trim() || null,
        date,
        place: place ? Number(place) : null,
      }),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error(
        isEdit
          ? 'Impossible de modifier cette performance.'
          : "Impossible d'ajouter cette performance."
      )
      return
    }
    toast.success(isEdit ? 'Performance modifiée.' : 'Performance ajoutée.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier la performance' : 'Ajouter une performance'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="perf-time">
              Temps <span className="text-destructive">*</span>
            </Label>
            <Input
              id="perf-time"
              autoFocus
              placeholder="Ex : 42.15"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="perf-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perf-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perf-place">Place</Label>
              <Input
                id="perf-place"
                type="number"
                min={1}
                placeholder="Ex : 1"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="perf-location">Lieu</Label>
            <Input
              id="perf-location"
              placeholder="Ex : Stade de la Plaine"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuler</Button>} />
          <Button onClick={handleSubmit} disabled={loading || !time.trim() || !date}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
