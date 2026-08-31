'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Plus, UserPlus, UsersRound, X, ArrowRight } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/athlete'
import { TEAM_RELAY_DISCIPLINES } from '@/lib/disciplines'
import { cn } from '@/lib/utils'
import { AthleteAvatar } from './athlete-avatar'
import { DeleteTeamButton } from './delete-team-button'
import { TeamColorPicker } from './team-color-picker'
import { TeamPhotoUpload } from './team-photo-upload'
import { RelayBuilder, type RelaySlot, type RelaySlotAthlete } from './relay-builder'
import { AthleteSelectDialog, type SelectableAthlete } from './athlete-select-dialog'
import { GuestAddDialog } from './guest-add-dialog'
import type { CropConfig } from '@/components/athletes/image-position-editor'

export type TeamFormInitialData = {
  name: string
  discipline: string | null
  color: string | null
  photoUrl: string | null
  photoConfig: CropConfig
  positioned: RelaySlot[]
  bench: RelaySlotAthlete[]
}

/**
 * Formulaire unique réutilisé en création (/teams/new) et édition
 * (/teams/[id]/edit) — même pattern que CompetitionForm/AthleteForm : un seul
 * état local, un seul bouton "Enregistrer"/"Créer", un seul appel réseau au
 * submit. Pas d'auto-save au fil de l'eau.
 */
export function TeamForm({
  mode,
  teamId,
  initialData,
  allAthletes,
  canManageMembers = true,
  canDelete = false,
}: {
  mode: 'create' | 'edit'
  teamId?: string
  initialData?: TeamFormInitialData
  allAthletes: SelectableAthlete[]
  /** Ajouter/retirer des athlètes de l'équipe reste réservé coach/admin. */
  canManageMembers?: boolean
  /** Staff, ou l'auteur de la création de l'équipe (lui seul). */
  canDelete?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialData?.name ?? '')
  const [discipline, setDiscipline] = useState<string | null>(initialData?.discipline ?? null)
  const [color, setColor] = useState<string | null>(initialData?.color ?? null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl ?? null)
  const [photoConfig, setPhotoConfig] = useState<CropConfig>(initialData?.photoConfig ?? {})
  const [slots, setSlots] = useState<RelaySlot[]>(initialData?.positioned ?? [])
  const [bench, setBench] = useState<RelaySlotAthlete[]>(initialData?.bench ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)

  const rosterIds = [...slots.map((s) => s.athlete.id), ...bench.map((a) => a.id)]

  function addAthlete(athlete: SelectableAthlete) {
    setBench((b) => [...b, athlete])
  }

  function addGuest(firstName: string, lastName: string) {
    setBench((b) => [
      ...b,
      {
        id: `newguest:${crypto.randomUUID()}`,
        isGuest: true,
        firstName,
        lastName,
        photoUrl: null,
        photoConfig: {},
      },
    ])
  }

  function removeFromTeam(athleteId: string) {
    setSlots((s) => s.filter((slot) => slot.athlete.id !== athleteId))
    setBench((b) => b.filter((a) => a.id !== athleteId))
  }

  function positionBenchAthlete(athleteId: string) {
    if (slots.length >= 4) return
    const athlete = bench.find((a) => a.id === athleteId)
    if (!athlete) return
    setBench((b) => b.filter((a) => a.id !== athleteId))
    setSlots((s) => [...s, { athlete, handoffMark: null }])
  }

  function unpositionAthlete(athleteId: string) {
    const slot = slots.find((s) => s.athlete.id === athleteId)
    if (!slot) return
    setSlots((s) => s.filter((x) => x.athlete.id !== athleteId))
    setBench((b) => [...b, slot.athlete])
  }

  // Un invité (pas de compte athlète) est identifié côté client par un id
  // préfixé — `guest:<teamMemberId>` s'il existait déjà en base,
  // `newguest:<uuid>` s'il vient d'être ajouté dans ce formulaire. Dans les
  // deux cas on envoie nom/prénom ; `guestId` (sans le préfixe) permet à
  // l'API de mettre à jour la ligne existante au lieu d'en recréer une.
  function toMemberPayload(
    a: RelaySlotAthlete,
    relayOrder: number | null,
    handoffMark: string | null
  ) {
    if (a.id.startsWith('guest:')) {
      return {
        guestId: a.id.slice('guest:'.length),
        guestFirstName: a.firstName,
        guestLastName: a.lastName,
        relayOrder,
        handoffMark,
      }
    }
    if (a.id.startsWith('newguest:')) {
      return { guestFirstName: a.firstName, guestLastName: a.lastName, relayOrder, handoffMark }
    }
    return { athleteId: a.id, relayOrder, handoffMark }
  }

  async function handleSubmit() {
    if (!name.trim() || !discipline) return
    setLoading(true)

    const members = [
      ...slots.map((s, i) => toMemberPayload(s.athlete, i + 1, s.handoffMark)),
      ...bench.map((a) => toMemberPayload(a, null, null)),
    ]

    const res = await fetch(mode === 'edit' ? `/api/teams/${teamId}` : '/api/teams', {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        discipline,
        color,
        photoUrl,
        photoConfig,
        members,
      }),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error(mode === 'edit' ? "Impossible d'enregistrer." : "Impossible de créer l'équipe.")
      return
    }
    const id = mode === 'edit' ? teamId! : ((await res.json()) as { id: string }).id
    toast.success(mode === 'edit' ? 'Équipe mise à jour.' : 'Équipe créée.')
    router.push(`/teams/${id}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <BackButton
        label={mode === 'edit' ? "Retour à l'équipe" : 'Retour aux équipes'}
        href={mode === 'edit' ? `/teams/${teamId}` : '/teams'}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'edit' ? "Modifier l'équipe" : 'Nouvelle équipe de relais'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ajoute jusqu&apos;à 4 athlètes, ordonne-les et renseigne les marques de transmission —
            tu peux valider sans tous les avoir.
          </p>
        </div>
        {mode === 'edit' && canDelete && teamId && <DeleteTeamButton teamId={teamId} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr] xl:items-start">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="team-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              autoFocus
              placeholder="Ex : 4x100m Hommes"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Discipline <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {TEAM_RELAY_DISCIPLINES.map((d) => {
                const active = discipline === d.value
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDiscipline(d.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Photo de l&apos;équipe</Label>
            <TeamPhotoUpload
              photoUrl={photoUrl}
              photoConfig={photoConfig}
              onPhotoChange={(url) => {
                setPhotoUrl(url)
                if (!url) setPhotoConfig({})
              }}
              onConfigChange={setPhotoConfig}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Couleur de l&apos;équipe</Label>
            <TeamColorPicker value={color} onChange={setColor} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
          className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
        >
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label className="text-sm">Athlètes du relais ({slots.length}/4)</Label>
              {canManageMembers && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setGuestDialogOpen(true)}>
                    <UserPlus className="size-4" />
                    Invité
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                    <Plus className="size-4" />
                    Ajouter
                  </Button>
                </div>
              )}
            </div>

            {slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
                <UsersRound className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucun athlète positionné.</p>
              </div>
            ) : (
              <RelayBuilder slots={slots} onChange={setSlots} onRemove={unpositionAthlete} />
            )}
          </div>

          {bench.length > 0 && (
            <div>
              <Label className="mb-3 block text-sm">Remplaçants</Label>
              <div className="space-y-2">
                {bench.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
                  >
                    <AthleteAvatar athlete={a} className="size-10" />
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold">
                      {fullName(a.firstName, a.lastName)}
                      {a.isGuest && (
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Invité
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {slots.length < 4 && (
                        <button
                          type="button"
                          onClick={() => positionBenchAthlete(a.id)}
                          className="rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10"
                          aria-label="Positionner dans le relais"
                          title="Positionner dans le relais"
                        >
                          <ArrowRight className="size-4" />
                        </button>
                      )}
                      {canManageMembers && (
                        <button
                          type="button"
                          onClick={() => removeFromTeam(a.id)}
                          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Retirer de l'équipe"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={loading || !name.trim() || !discipline}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'edit' ? 'Enregistrer' : "Créer l'équipe"}
        </Button>
      </div>

      {canManageMembers && (
        <>
          <AthleteSelectDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            allAthletes={allAthletes}
            excludeIds={rosterIds}
            onSelect={addAthlete}
          />
          <GuestAddDialog
            open={guestDialogOpen}
            onOpenChange={setGuestDialogOpen}
            onAdd={addGuest}
          />
        </>
      )}
    </div>
  )
}
