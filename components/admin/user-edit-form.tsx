'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, ShieldCheck, LinkIcon, TriangleAlert } from 'lucide-react'
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
import { userUpdateSchema } from '@/lib/validations/user'
import { fullName } from '@/lib/athlete'
import { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

type UserFormValues = z.infer<typeof userUpdateSchema>

export type AthleteOption = { id: string; firstName: string; lastName: string }

const NONE_VALUE = '__none__'

export function UserEditForm({
  user,
  athletes,
  isSelf,
}: {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    roles: Role[]
    linkedAthleteId: string | null
  }
  athletes: AthleteOption[]
  isSelf: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
    },
  })

  const roles = watch('roles')

  function toggleRole(role: Role, checked: boolean) {
    if (checked) {
      setValue('roles', [...roles, role], { shouldValidate: true })
    } else {
      setValue(
        'roles',
        roles.filter((r) => r !== role),
        { shouldValidate: true }
      )
    }
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
    toast.success('Utilisateur mis à jour.')
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Colonne gauche */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={User}>Identité</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={LinkIcon}>Profil athlète lié</SectionTitle>
            <Controller
              control={control}
              name="linkedAthleteId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NONE_VALUE}
                  onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Aucun profil lié">
                      {(value: string | null) => {
                        if (!value || value === NONE_VALUE) return 'Aucun profil lié'
                        const a = athletes.find((x) => x.id === value)
                        return a ? fullName(a.firstName, a.lastName) : 'Aucun profil lié'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Aucun profil lié</SelectItem>
                    {athletes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {fullName(a.firstName, a.lastName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Associe ce compte au profil athlète correspondant, pour lui donner accès à ses propres
              données.
            </p>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {isSelf && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4 shrink-0 translate-y-0.5" />
              Vous modifiez votre propre compte.
            </div>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionTitle icon={ShieldCheck}>Rôles</SectionTitle>
            <div className="space-y-1">
              {ALL_ROLES.map((role) => {
                const checked = roles.includes(role)
                return (
                  <label
                    key={role}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                      checked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => toggleRole(role, c === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{ROLE_LABELS[role]}</div>
                      <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</div>
                    </div>
                  </label>
                )
              })}
            </div>
            {errors.roles && (
              <p className="mt-2 text-xs text-destructive">{errors.roles.message}</p>
            )}
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
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
