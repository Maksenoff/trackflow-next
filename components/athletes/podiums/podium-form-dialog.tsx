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
import { cn } from '@/lib/utils'
import { MEDAL_GRADIENTS } from './medal-colors'
import type { PodiumItem } from './podiums-view'

export function PodiumFormDialog({
  open,
  onOpenChange,
  athleteId,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  athleteId: string
  editing: PodiumItem | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rank, setRank] = useState(1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [level, setLevel] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [performance, setPerformance] = useState('')
  const [venue, setVenue] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setRank(editing.rank)
      setYear(editing.year)
      setLevel(editing.level)
      setDiscipline(editing.discipline)
      setPerformance(editing.performance ?? '')
      setVenue(editing.venue ?? '')
      setDate(editing.recordedAt.toISOString().slice(0, 10))
    } else {
      setRank(1)
      setYear(new Date().getFullYear())
      setLevel('')
      setDiscipline('')
      setPerformance('')
      setVenue('')
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [open, editing])

  async function handleSubmit() {
    if (!level.trim() || !discipline.trim() || !date) return
    setLoading(true)

    const url = editing
      ? `/api/athletes/${athleteId}/podiums/${editing.id}`
      : `/api/athletes/${athleteId}/podiums`
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year,
        rank,
        level: level.trim(),
        discipline: discipline.trim(),
        performance: performance.trim() || null,
        recordedAt: date,
        venue: venue.trim() || null,
      }),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error(editing ? 'Impossible de modifier ce podium.' : "Impossible d'ajouter ce podium.")
      return
    }
    toast.success(editing ? 'Podium mis à jour.' : 'Podium ajouté.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Modifier le podium' : 'Ajouter un podium'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Place</Label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRank(r)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-extrabold text-white transition-transform',
                    rank === r ? 'scale-105 shadow-lg' : 'border-transparent opacity-50'
                  )}
                  style={{
                    background: MEDAL_GRADIENTS[r].disc,
                    borderColor: rank === r ? MEDAL_GRADIENTS[r].ring : 'transparent',
                  }}
                >
                  {r}
                  {r === 1 ? 'er' : 'ème'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="podium-year">Année</Label>
              <Input
                id="podium-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="podium-date">Date</Label>
              <Input
                id="podium-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="podium-discipline">
              Discipline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="podium-discipline"
              autoFocus
              placeholder="Ex : 100m, Longueur..."
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="podium-level">
              Niveau <span className="text-destructive">*</span>
            </Label>
            <Input
              id="podium-level"
              placeholder="Ex : Club, Départemental, Régional..."
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="podium-performance">Performance</Label>
              <Input
                id="podium-performance"
                placeholder="Ex : 14''79"
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="podium-venue">Lieu</Label>
              <Input
                id="podium-venue"
                placeholder="Ex : Lens"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuler</Button>} />
          <Button
            onClick={handleSubmit}
            disabled={loading || !level.trim() || !discipline.trim() || !date}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
