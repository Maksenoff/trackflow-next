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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DisciplinePicker } from '@/components/competitions/discipline-picker'
import { filterDisciplineGroups, DISCIPLINE_LABELS } from '@/lib/disciplines'
import { fullName } from '@/lib/athlete'

export type RegistrationAthleteOption = { id: string; firstName: string; lastName: string }

export type RegistrationInitial = {
  disciplines: string[]
  ffaRegistered: boolean
  expectedPerformances: Record<string, string> | null
}

export function RegistrationDialog({
  open,
  onOpenChange,
  competitionId,
  availableDisciplines,
  requestExpectedPerf,
  canManage,
  athletes,
  registrationId,
  athleteId,
  athleteName,
  initialData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: string
  availableDisciplines: string[]
  requestExpectedPerf: boolean
  canManage: boolean
  athletes?: RegistrationAthleteOption[]
  registrationId?: string
  athleteId?: string
  athleteName?: string
  initialData?: RegistrationInitial
}) {
  const router = useRouter()
  const isEdit = !!registrationId
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | undefined>(athleteId)
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [ffaRegistered, setFfaRegistered] = useState(false)
  const [perf, setPerf] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedAthleteId(athleteId)
    setDisciplines(initialData?.disciplines ?? [])
    setFfaRegistered(initialData?.ffaRegistered ?? false)
    setPerf(initialData?.expectedPerformances ?? {})
  }, [open, athleteId, initialData])

  const groups = filterDisciplineGroups(availableDisciplines)

  async function handleSubmit() {
    if (!selectedAthleteId || disciplines.length === 0) return
    setLoading(true)
    const url = isEdit
      ? `/api/competitions/${competitionId}/registrations/${registrationId}`
      : `/api/competitions/${competitionId}/registrations`
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athleteId: selectedAthleteId,
        disciplines,
        ffaRegistered,
        expectedPerformances: requestExpectedPerf ? perf : null,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error(
        isEdit ? "Impossible de mettre à jour l'inscription." : "Impossible d'inscrire l'athlète."
      )
      return
    }
    toast.success(isEdit ? 'Inscription mise à jour.' : 'Athlète inscrit.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Modifier l'inscription" : 'Ajouter une inscription'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {isEdit ? (
            <div className="space-y-1.5">
              <Label>Athlète</Label>
              <p className="text-sm font-semibold">{athleteName}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Athlète</Label>
              <Select
                value={selectedAthleteId}
                onValueChange={(v) => setSelectedAthleteId(v ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un athlète">
                    {(value: string | null) => {
                      const a = athletes?.find((x) => x.id === value)
                      return a ? fullName(a.firstName, a.lastName) : 'Choisir un athlète'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(athletes ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {fullName(a.firstName, a.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(athletes ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tous les athlètes sont déjà inscrits à cette compétition.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Disciplines</Label>
            <DisciplinePicker groups={groups} value={disciplines} onChange={setDisciplines} />
            {disciplines.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Sélectionne au moins une discipline.
              </p>
            )}
          </div>

          {requestExpectedPerf && disciplines.length > 0 && (
            <div className="space-y-2">
              <Label>Performances attendues</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {disciplines.map((code) => (
                  <div key={code} className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {DISCIPLINE_LABELS[code] ?? code}
                    </span>
                    <Input
                      className="h-10"
                      value={perf[code] ?? ''}
                      onChange={(e) => setPerf({ ...perf, [code]: e.target.value })}
                      placeholder="Ex : 12.20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {canManage && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="reg-ffa"
                checked={ffaRegistered}
                onCheckedChange={(checked) => setFfaRegistered(checked === true)}
              />
              <label htmlFor="reg-ffa" className="cursor-pointer text-sm text-muted-foreground">
                Inscription FFA confirmée
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedAthleteId || disciplines.length === 0}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Inscrire'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
