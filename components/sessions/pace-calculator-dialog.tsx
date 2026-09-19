'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Gauge, Loader2, Ruler, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ANCHOR_DISTANCES,
  MAX_DISTANCE,
  computeTargetTimeSeconds,
  formatTimeSeconds,
  parseTimeInput,
  suggestedReferenceDistance,
} from '@/lib/pace-calculator'
import { cn } from '@/lib/utils'

const QUICK_DISTANCES = [60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800]

/**
 * Calculateur d'allure — accessible depuis chaque séance (bouton dans
 * SessionHeader), personnel au compte connecté et pas à un profil Athlete
 * (demande Maksen 2026-09-20 : "tout le monde à accès au calculateur, c'est
 * personnelle"). Se souvient des temps repère saisis (100/200/300/400/600/
 * 800m) d'une séance à l'autre via `/api/pace-references` — voir
 * lib/pace-calculator.ts pour la règle de calcul.
 */
export function PaceCalculatorDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [references, setReferences] = useState<Map<number, number>>(new Map())

  const [targetInput, setTargetInput] = useState('150')
  const [referenceDistance, setReferenceDistance] = useState(200)
  const [referenceTimeInput, setReferenceTimeInput] = useState('')
  const [percentInput, setPercentInput] = useState('100')
  const [savedPercent, setSavedPercent] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/pace-references')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(
        (data: {
          references: { distance: number; timeSeconds: number }[]
          percent: number | null
        }) => {
          const map = new Map(data.references.map((r) => [r.distance, r.timeSeconds]))
          setReferences(map)
          setSavedPercent(data.percent)
          if (data.percent !== null) setPercentInput(String(data.percent))
        }
      )
      .catch(() => toast.error('Impossible de charger tes temps enregistrés.'))
      .finally(() => setLoading(false))
  }, [open])

  const targetDistance = Number(targetInput)
  const targetValid =
    Number.isFinite(targetDistance) && targetDistance > 0 && targetDistance <= MAX_DISTANCE

  // Suggère automatiquement la distance repère quand la cible change — sauf
  // si l'utilisateur a déjà choisi une distance repère lui-même pour cette
  // ouverture du calculateur (évite d'écraser son choix manuel à chaque
  // frappe dans le champ distance cible).
  const [refTouched, setRefTouched] = useState(false)
  useEffect(() => {
    if (refTouched || !targetValid) return
    setReferenceDistance(suggestedReferenceDistance(targetDistance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDistance, targetValid])

  // Préremplit le temps repère depuis la valeur enregistrée dès que la
  // distance repère change (ouverture, changement manuel, ou suggestion
  // automatique ci-dessus).
  useEffect(() => {
    const saved = references.get(referenceDistance)
    setReferenceTimeInput(saved !== undefined ? String(saved) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDistance, references])

  const referenceTimeSeconds = parseTimeInput(referenceTimeInput)
  const percent = Number(percentInput)
  const percentValid = Number.isFinite(percent) && percent > 0

  const resultSeconds = useMemo(() => {
    if (!targetValid || referenceTimeSeconds === null || !percentValid) return null
    return computeTargetTimeSeconds(
      referenceDistance,
      referenceTimeSeconds,
      targetDistance,
      percent
    )
  }, [targetValid, referenceTimeSeconds, percentValid, referenceDistance, targetDistance, percent])

  async function saveReferenceTime() {
    if (referenceTimeSeconds === null) return
    if (references.get(referenceDistance) === referenceTimeSeconds) return // déjà à jour
    setSaving(true)
    const res = await fetch('/api/pace-references', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance: referenceDistance, timeSeconds: referenceTimeSeconds }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Temps non enregistré.')
      return
    }
    setReferences((prev) => new Map(prev).set(referenceDistance, referenceTimeSeconds))
  }

  async function savePercentValue() {
    if (!percentValid) return
    if (savedPercent === percent) return // déjà à jour
    setSaving(true)
    const res = await fetch('/api/pace-references', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percent }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('% non enregistré.')
      return
    }
    setSavedPercent(percent)
  }

  async function handleReset() {
    setSaving(true)
    const res = await fetch('/api/pace-references', { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      toast.error('Réinitialisation impossible.')
      return
    }
    setReferences(new Map())
    setReferenceTimeInput('')
    setPercentInput('100')
    setSavedPercent(null)
    toast.success('Temps repère réinitialisés.')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Gauge className="size-3.5" />
            Calculateur d&apos;allure
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculateur d&apos;allure</DialogTitle>
          <DialogDescription>
            Entre ton temps sur une distance repère connue, l&apos;outil en déduit ton temps cible
            sur la distance de la séance, au % d&apos;allure demandé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pace-target">Distance de la séance (m)</Label>
            <Input
              id="pace-target"
              type="number"
              min={1}
              max={MAX_DISTANCE}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              aria-invalid={!targetValid}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_DISTANCES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setTargetInput(String(d))
                    setRefTouched(false)
                  }}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                    targetDistance === d
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
            {!targetValid && (
              <p className="text-xs text-destructive">Distance entre 1 et {MAX_DISTANCE}m.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pace-ref-distance">Distance repère</Label>
              <Select
                value={String(referenceDistance)}
                onValueChange={(v) => {
                  setReferenceDistance(Number(v))
                  setRefTouched(true)
                }}
              >
                <SelectTrigger id="pace-ref-distance" className="w-full">
                  <Ruler className="size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue>{() => `${referenceDistance}m`}</SelectValue>
                </SelectTrigger>
                <SelectContent className="no-scrollbar">
                  {ANCHOR_DISTANCES.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      <Ruler className="size-3.5" />
                      {d}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pace-ref-time">Ton temps sur {referenceDistance}m</Label>
              <Input
                id="pace-ref-time"
                placeholder="25.4 ou 1:05.3"
                value={referenceTimeInput}
                onChange={(e) => setReferenceTimeInput(e.target.value)}
                onBlur={saveReferenceTime}
                disabled={loading}
                aria-invalid={referenceTimeInput !== '' && referenceTimeSeconds === null}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pace-percent">% d&apos;allure demandé</Label>
            <Input
              id="pace-percent"
              type="number"
              min={1}
              max={130}
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
              onBlur={savePercentValue}
              aria-invalid={!percentValid}
            />
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 text-center transition-colors',
              resultSeconds !== null
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/40'
            )}
          >
            <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Temps cible — {targetValid ? targetDistance : '—'}m à {percentValid ? percent : '—'}%
            </div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums">
              {resultSeconds !== null ? formatTimeSeconds(resultSeconds) : '—'}
            </div>
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={saving}
                >
                  <RotateCcw className="size-3.5" />
                  Réinitialiser
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser tes temps repère ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tous tes temps enregistrés (100/200/300/400/600/800m) seront effacés. Cette action
                  est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
