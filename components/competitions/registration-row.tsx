'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Pencil, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { initials, fullName } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { cn } from '@/lib/utils'
import type { CompetitionDetail } from '@/lib/competitions-data'

type Registration = CompetitionDetail['registrations'][number]

export function RegistrationRow({
  registration,
  competitionId,
  isSelf,
  canManage,
  onEdit,
}: {
  registration: Registration
  competitionId: string
  isSelf: boolean
  canManage: boolean
  onEdit: () => void
}) {
  const router = useRouter()
  const [togglingFfa, setTogglingFfa] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const disciplines = JSON.parse(registration.disciplines) as string[]
  const perf = registration.expectedPerformances
    ? (JSON.parse(registration.expectedPerformances) as Record<string, string>)
    : null

  async function setFfa(next: boolean) {
    setTogglingFfa(true)
    const res = await fetch(`/api/competitions/${competitionId}/registrations/${registration.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ffaRegistered: next }),
    })
    setTogglingFfa(false)
    if (!res.ok) {
      toast.error('Impossible de mettre à jour le statut FFA.')
      return
    }
    router.refresh()
  }

  async function handleRemove() {
    setDeleting(true)
    const res = await fetch(`/api/competitions/${competitionId}/registrations/${registration.id}`, {
      method: 'DELETE',
    })
    setDeleting(false)
    if (!res.ok) {
      toast.error('Impossible de retirer cette inscription.')
      return
    }
    toast.success('Inscription retirée.')
    router.refresh()
  }

  return (
    <div
      className={cn(
        'flex h-full items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        registration.ffaRegistered
          ? 'border-emerald-500/25 bg-emerald-500/[0.05] hover:border-emerald-500/40 dark:bg-emerald-500/[0.07]'
          : 'border-border bg-card hover:border-primary/20'
      )}
    >
      {registration.athlete.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={registration.athlete.photoUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {initials(registration.athlete.firstName, registration.athlete.lastName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">
            {fullName(registration.athlete.firstName, registration.athlete.lastName)}
          </span>
          {registration.athlete.licenseNumber && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              #{registration.athlete.licenseNumber}
            </span>
          )}
          {isSelf && (
            <Badge variant="destructive" className="text-[10px]">
              Toi
            </Badge>
          )}
          {registration.ffaRegistered && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" />
              FFA
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {disciplines.map((d) => (
            <Badge key={d} variant="secondary" className="text-[10px]">
              {DISCIPLINE_LABELS[d] ?? d}
              {perf?.[d] ? ` · ${perf[d]}` : ''}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {canManage && (
          <label
            className={cn(
              'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition-colors',
              registration.ffaRegistered
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border text-muted-foreground hover:bg-muted/50',
              togglingFfa && 'opacity-60'
            )}
          >
            {togglingFfa ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Checkbox
                checked={registration.ffaRegistered}
                onCheckedChange={(checked) => setFfa(checked === true)}
                disabled={togglingFfa}
                className="size-3.5 data-checked:border-emerald-500 data-checked:bg-emerald-500"
              />
            )}
            FFA
          </label>
        )}
        {(canManage || isSelf) && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Modifier">
              <Pencil className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Retirer">
                    <X className="size-3.5" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirer cette inscription ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {fullName(registration.athlete.firstName, registration.athlete.lastName)} ne
                    sera plus inscrit·e à cette compétition.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    disabled={deleting}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleting && <Loader2 className="size-4 animate-spin" />}
                    Retirer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  )
}
