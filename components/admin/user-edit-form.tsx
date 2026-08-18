'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { toast } from 'sonner'
import {
  Loader2,
  User,
  ShieldCheck,
  LinkIcon,
  TriangleAlert,
  Dumbbell,
  Trophy,
  UserCircle2,
  Check,
  KeyRound,
  Info,
  Ban,
  Video,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { userUpdateSchema } from '@/lib/validations/user'
import { fullName, initials, GENDER_LABELS } from '@/lib/athlete'
import { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, type Role } from '@/lib/roles'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { cn } from '@/lib/utils'

type UserFormValues = z.infer<typeof userUpdateSchema>

export type AthleteOption = { id: string; firstName: string; lastName: string }

const NONE_VALUE = '__none__'

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  ROLE_ADMIN: ShieldCheck,
  ROLE_COACH: Dumbbell,
  ROLE_COMPETITION_MANAGER: Trophy,
  ROLE_ATHLETE: UserCircle2,
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'Jamais'
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type LinkedAthleteInfo = {
  id: string
  firstName: string
  lastName: string
  birthDate: Date | null
  gender: string | null
  licenseNumber: string | null
  ffaProfileUrl: string | null
  disciplines: string[]
  videosEnabled: boolean
}

export function UserEditForm({
  user,
  athletes,
  isSelf,
  linkedAthlete,
}: {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    roles: Role[]
    linkedAthleteId: string | null
    disabled: boolean
    createdAt: Date
    lastLoginAt: Date | null
  }
  athletes: AthleteOption[]
  isSelf: boolean
  linkedAthlete: LinkedAthleteInfo | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [athleteVideosEnabled, setAthleteVideosEnabled] = useState(
    linkedAthlete?.videosEnabled ?? true
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      linkedAthleteId: user.linkedAthleteId,
      disabled: user.disabled,
    },
  })

  const roles = watch('roles')
  const selectedRole = roles[0] ?? null

  function selectRole(role: Role) {
    setValue('roles', [role], { shouldValidate: true })
  }

  async function onSubmit(data: UserFormValues) {
    setLoading(true)
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) {
      toast.error(body?.error ?? "Impossible de mettre à jour l'utilisateur.")
      return
    }

    if (linkedAthlete && athleteVideosEnabled !== linkedAthlete.videosEnabled) {
      await fetch(`/api/athletes/${linkedAthlete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videosEnabled: athleteVideosEnabled }),
      })
    }

    toast.success('Utilisateur mis à jour.')
    router.push('/admin/users')
    router.refresh()
  }

  async function handleResetPassword() {
    setResetError(null)
    if (resetPassword.length < 8) {
      setResetError('Minimum 8 caractères.')
      return
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Les mots de passe ne correspondent pas.')
      return
    }
    setResetLoading(true)
    const res = await fetch(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    })
    setResetLoading(false)
    if (!res.ok) {
      toast.error('Impossible de réinitialiser le mot de passe.')
      return
    }
    toast.success('Mot de passe réinitialisé.')
    setResetOpen(false)
    setResetPassword('')
    setResetConfirm('')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Barre d'action — nom, email, Annuler/Enregistrer toujours visibles sans scroller */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground">
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {isSelf && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-4 shrink-0 translate-y-0.5" />
          Vous modifiez votre propre compte.
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Colonne gauche */}
        <div className="@container space-y-6">
          <div
            className={cn(
              'grid grid-cols-1 items-stretch gap-6 @md:grid-cols-2',
              linkedAthlete && '@3xl:grid-cols-3'
            )}
          >
            <section className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionTitle icon={User}>Identité</SectionTitle>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionTitle icon={LinkIcon}>Profil athlète lié</SectionTitle>
              <Controller
                control={control}
                name="linkedAthleteId"
                render={({ field }) => {
                  const linked = field.value ? athletes.find((x) => x.id === field.value) : null
                  return (
                    <Select
                      value={field.value ?? NONE_VALUE}
                      onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                    >
                      <SelectTrigger className="w-full max-w-56 rounded-full">
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            linked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {linked ? initials(linked.firstName, linked.lastName) : '—'}
                        </span>
                        <SelectValue placeholder="Aucun profil lié">
                          {() =>
                            linked
                              ? fullName(linked.firstName, linked.lastName)
                              : 'Aucun profil lié'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value={NONE_VALUE}>Aucun profil lié</SelectItem>
                        {athletes.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {fullName(a.firstName, a.lastName)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              <p className="mt-2.5 text-xs text-muted-foreground">
                Associe ce compte au profil athlète correspondant, pour lui donner accès à ses
                propres données.
              </p>
            </section>

            {linkedAthlete && (
              <section className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <SectionTitle icon={Video}>Onglet Vidéos</SectionTitle>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Affiche ou masque l&apos;onglet Vidéos sur le profil de cet athlète.
                  </p>
                  <Switch
                    aria-label="Onglet Vidéos"
                    checked={athleteVideosEnabled}
                    onCheckedChange={(checked) => setAthleteVideosEnabled(checked === true)}
                  />
                </div>
              </section>
            )}
          </div>

          {linkedAthlete && (
            <div className="grid grid-cols-1 items-stretch gap-6 @md:grid-cols-2">
              <section className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <SectionTitle icon={ShieldCheck}>
                  {fullName(linkedAthlete.firstName, linkedAthlete.lastName)}
                </SectionTitle>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <Info className="size-3.5" />
                  Infos (lecture seule)
                </div>
                <div className="space-y-1.5 text-xs">
                  <InfoRow
                    label="Date de naissance"
                    value={formatBirthDate(linkedAthlete.birthDate)}
                  />
                  <InfoRow
                    label="Genre"
                    value={linkedAthlete.gender ? GENDER_LABELS[linkedAthlete.gender] : null}
                  />
                  <InfoRow label="N° de licence" value={linkedAthlete.licenseNumber} />
                  <InfoRow
                    label="URL athle.fr"
                    value={
                      linkedAthlete.ffaProfileUrl ? (
                        <a
                          href={linkedAthlete.ffaProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-primary hover:underline"
                        >
                          {linkedAthlete.ffaProfileUrl}
                        </a>
                      ) : null
                    }
                  />
                </div>
              </section>

              <section className="flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <SectionTitle icon={ListChecks}>Spécialités choisies</SectionTitle>
                {linkedAthlete.disciplines.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {linkedAthlete.disciplines.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[10px]">
                        {DISCIPLINE_LABELS[d] ?? d}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucune spécialité renseignée.</p>
                )}
              </section>
            </div>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={KeyRound}>Sécurité</SectionTitle>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Définit un nouveau mot de passe pour ce compte (pas de reset self-service).
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                <KeyRound className="size-3.5" />
                Réinitialiser le mot de passe
              </Button>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={ShieldCheck}>Rôle</SectionTitle>
            <div className="space-y-1.5">
              {ALL_ROLES.map((role) => {
                const isSelected = selectedRole === role
                const Icon = ROLE_ICONS[role]
                const color = ROLE_COLORS[role]
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectRole(role)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                      isSelected ? 'shadow-sm' : 'border-border hover:bg-muted/40'
                    )}
                    style={
                      isSelected
                        ? { borderColor: `${color}66`, backgroundColor: `${color}0f` }
                        : undefined
                    }
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
                      style={{
                        backgroundColor: isSelected ? color : 'var(--muted)',
                        color: isSelected ? 'white' : 'var(--muted-foreground)',
                      }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold">{ROLE_LABELS[role]}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </div>
                    </div>
                    <span
                      className="flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                      style={{ borderColor: isSelected ? color : 'var(--border)' }}
                    >
                      {isSelected && (
                        <span
                          className="flex size-full items-center justify-center rounded-full"
                          style={{ backgroundColor: color }}
                        >
                          <Check className="size-2.5 text-white" />
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.roles && (
              <p className="mt-2 text-xs text-destructive">{errors.roles.message}</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={Info}>Compte</SectionTitle>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span className="font-medium">{formatDateTime(user.lastLoginAt)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-start gap-2">
                <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold">Compte désactivé</div>
                  <div className="text-[11px] text-muted-foreground">
                    Bloque la connexion sans supprimer le compte.
                  </div>
                </div>
              </div>
              <Controller
                control={control}
                name="disabled"
                render={({ field }) => (
                  <Switch
                    aria-label="Compte désactivé"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={isSelf}
                  />
                )}
              />
            </div>
            {isSelf && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Tu ne peux pas désactiver ton propre compte.
              </p>
            )}
          </section>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">Nouveau mot de passe</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm">Confirmer</Label>
              <Input
                id="reset-confirm"
                type="password"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
              />
            </div>
            {resetError && <p className="text-xs text-destructive">{resetError}</p>}
            <Button
              type="button"
              className="w-full"
              disabled={resetLoading}
              onClick={handleResetPassword}
            >
              {resetLoading && <Loader2 className="size-4 animate-spin" />}
              Réinitialiser
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
      <Icon className="size-4" />
      {children}
    </h2>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value || '—'}</span>
    </div>
  )
}

function formatBirthDate(value: Date | null): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
