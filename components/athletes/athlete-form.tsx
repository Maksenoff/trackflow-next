'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { athleteInputSchema } from '@/lib/validations/athlete'
import { ATHLETE_SPECIALTIES, DEFAULT_DISCIPLINE_COLORS } from '@/lib/disciplines'
import { fileToDataUrl } from '@/lib/file-to-data-url'
import { cn } from '@/lib/utils'

type AthleteFormValues = z.input<typeof athleteInputSchema>

const BANNER_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#a78bfa',
  '#ec4899',
  '#0ea5e9',
]

export function AthleteForm({
  mode,
  athleteId,
  initialData,
}: {
  mode: 'create' | 'edit'
  athleteId?: string
  initialData?: Partial<AthleteFormValues>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialData?.bannerUrl ?? null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteInputSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: undefined,
      licenseNumber: '',
      ffaProfileUrl: '',
      notes: '',
      disciplines: [],
      disciplineColors: {},
      photoUrl: null,
      bannerUrl: null,
      bannerConfig: { mode: 'pattern', color: BANNER_COLORS[0], zoom: 1 },
      ...initialData,
    },
  })

  const disciplines = watch('disciplines') ?? []
  const disciplineColors = watch('disciplineColors') ?? {}
  const bannerConfig = watch('bannerConfig') ?? { mode: 'pattern' }
  const gender = watch('gender')

  function toggleDiscipline(value: string) {
    const next = disciplines.includes(value)
      ? disciplines.filter((d) => d !== value)
      : [...disciplines, value]
    setValue('disciplines', next)
    if (!disciplineColors[value] && !disciplines.includes(value)) {
      const color = DEFAULT_DISCIPLINE_COLORS[next.length % DEFAULT_DISCIPLINE_COLORS.length]
      setValue('disciplineColors', { ...disciplineColors, [value]: color })
    }
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setPhotoUrl(dataUrl)
    setValue('photoUrl', dataUrl)
  }

  async function handleBannerChange(file: File | undefined) {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setBannerUrl(dataUrl)
    setValue('bannerUrl', dataUrl)
    setValue('bannerConfig', { ...bannerConfig, mode: 'photo' })
  }

  async function onSubmit(values: AthleteFormValues) {
    setLoading(true)
    const url = mode === 'create' ? '/api/athletes' : `/api/athletes/${athleteId}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error("Une erreur est survenue lors de l'enregistrement.")
      return
    }

    const data = await res.json()
    const id = mode === 'create' ? data.id : athleteId
    toast.success(mode === 'create' ? 'Athlète créé avec succès.' : 'Profil mis à jour.')
    router.push(`/athletes/${id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Identité */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Identité
        </h2>
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
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
          </div>
          <div className="space-y-1.5">
            <Label>Genre</Label>
            <Select
              value={gender ?? undefined}
              onValueChange={(v) => setValue('gender', v as AthleteFormValues['gender'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Non spécifié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Homme</SelectItem>
                <SelectItem value="F">Femme</SelectItem>
                <SelectItem value="X">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenseNumber">Numéro de licence</Label>
            <Input id="licenseNumber" placeholder="Ex : 123456" {...register('licenseNumber')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ffaProfileUrl">URL profil athle.fr</Label>
            <Input
              id="ffaProfileUrl"
              placeholder="https://www.athle.fr/athletes/XXXXX/resultats"
              {...register('ffaProfileUrl')}
            />
          </div>
        </div>
      </section>

      {/* Spécialités */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Spécialités
        </h2>
        <div className="space-y-4">
          {Object.entries(ATHLETE_SPECIALTIES).map(([category, options]) => (
            <div key={category}>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(options).map(([label, value]) => {
                  const active = disciplines.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDiscipline(value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {disciplines.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Couleurs</p>
            <div className="flex flex-wrap gap-3">
              {disciplines.map((d) => (
                <label key={d} className="flex items-center gap-2 text-xs">
                  <input
                    type="color"
                    value={disciplineColors[d] ?? '#6366f1'}
                    onChange={(e) =>
                      setValue('disciplineColors', { ...disciplineColors, [d]: e.target.value })
                    }
                    className="size-6 cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Photo & bannière */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Apparence du profil
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Photo de profil</Label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt=""
                  className="size-16 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  Aucune
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                  className="max-w-56"
                />
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setPhotoUrl(null)
                      setValue('photoUrl', null)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bannière</Label>
            <div className="inline-flex rounded-full border border-border bg-muted/50 p-0.5 text-xs">
              {(['pattern', 'photo'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue('bannerConfig', { ...bannerConfig, mode: m })}
                  className={cn(
                    'rounded-full px-3 py-1 font-medium transition-colors',
                    bannerConfig.mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'pattern' ? 'Couleur' : 'Photo'}
                </button>
              ))}
            </div>

            {bannerConfig.mode === 'pattern' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {BANNER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue('bannerConfig', { ...bannerConfig, color: c })}
                      className={cn(
                        'size-7 rounded-full border-2 transition-transform',
                        bannerConfig.color === c
                          ? 'scale-110 border-foreground'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div
                  className="h-16 w-full rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${bannerConfig.color ?? BANNER_COLORS[0]}, ${bannerConfig.color ?? BANNER_COLORS[0]}66)`,
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleBannerChange(e.target.files?.[0])}
                />
                {bannerUrl && (
                  <>
                    <div
                      className="h-16 w-full rounded-lg bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${bannerUrl})`,
                        backgroundSize: `${(bannerConfig.zoom ?? 1) * 100}%`,
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Zoom</span>
                      <Slider
                        value={[bannerConfig.zoom ?? 1]}
                        min={1}
                        max={2}
                        step={0.05}
                        onValueChange={(v) =>
                          setValue('bannerConfig', {
                            ...bannerConfig,
                            zoom: Array.isArray(v) ? v[0] : v,
                          })
                        }
                        className="max-w-40"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Notes
        </h2>
        <Textarea rows={3} placeholder="Informations complémentaires..." {...register('notes')} />
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'create' ? "Créer l'athlète" : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
