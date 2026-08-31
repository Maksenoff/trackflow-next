'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Reorder, useDragControls } from 'framer-motion'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, ListChecks, ImageIcon, X, GripVertical } from 'lucide-react'
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
import { ImagePositionEditor } from '@/components/athletes/image-position-editor'
import { athleteInputSchema } from '@/lib/validations/athlete'
import {
  ATHLETE_SPECIALTIES,
  DEFAULT_DISCIPLINE_COLORS,
  DISCIPLINE_LABELS,
  defaultDisciplineColor,
} from '@/lib/disciplines'
import { uploadFile } from '@/lib/upload-file'
import type { FfaSyncResult } from '@/lib/ffa-scraper'
import { cn } from '@/lib/utils'

export type AthleteFormValues = z.input<typeof athleteInputSchema>

const NONE_VALUE = '__none__'

const CURRENT_SEASON_START =
  new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1

/** Une option par saison, depuis la saison de la perf la plus ancienne de l'athlète. */
function buildFfaSyncSeasonOptions(earliestSeasonStart: number | undefined) {
  const start = earliestSeasonStart ?? CURRENT_SEASON_START
  const length = Math.max(1, CURRENT_SEASON_START - start + 1)
  return Array.from({ length }, (_, i) => {
    const s = CURRENT_SEASON_START - i
    return { value: s, label: `${s}/${s + 1}` }
  })
}

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
  earliestSeasonStart,
}: {
  mode: 'create' | 'edit'
  athleteId?: string
  initialData?: Partial<AthleteFormValues>
  earliestSeasonStart?: number
}) {
  const router = useRouter()
  const ffaSyncSeasonOptions = buildFfaSyncSeasonOptions(earliestSeasonStart)
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialData?.bannerUrl ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

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
      ffaSyncSinceYear: null,
      disciplines: [],
      disciplineColors: {},
      photoUrl: null,
      photoConfig: {},
      bannerUrl: null,
      bannerConfig: { mode: 'pattern', color: BANNER_COLORS[0], zoom: 1 },
      videosEnabled: false,
      ...initialData,
    },
  })

  const disciplines = watch('disciplines') ?? []
  const disciplineColors = watch('disciplineColors') ?? {}
  const photoConfig = watch('photoConfig') ?? {}
  const bannerConfig = watch('bannerConfig') ?? { mode: 'pattern' }
  const gender = watch('gender')
  const ffaSyncSinceYear = watch('ffaSyncSinceYear')

  function toggleDiscipline(value: string) {
    const wasSelected = disciplines.includes(value)
    const next = wasSelected ? disciplines.filter((d) => d !== value) : [...disciplines, value]
    setValue('disciplines', next)
    if (wasSelected) {
      // Retire aussi la couleur : sinon elle reste orpheline dans disciplineColors
      // et continue de colorer les performances de cette discipline (ex: import
      // FFA) même une fois qu'elle n'est plus une spécialité choisie (correctif
      // 2026-08-27) — même souci corrigé côté serveur (lib/disciplines.ts,
      // reconcileDisciplineColors) en filet de sécurité si ce chemin est
      // contourné.
      setValue(
        'disciplineColors',
        Object.fromEntries(Object.entries(disciplineColors).filter(([key]) => key !== value))
      )
    } else if (!disciplineColors[value]) {
      setValue('disciplineColors', {
        ...disciplineColors,
        [value]: defaultDisciplineColor(next.length - 1),
      })
    }
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return
    // Aperçu instantané pendant l'upload en arrière-plan — l'éditeur de recadrage
    // n'a besoin que d'une source affichable, peu importe qu'elle soit finale ou non.
    const previewUrl = URL.createObjectURL(file)
    setPhotoUrl(previewUrl)
    setValue('photoConfig', { zoom: 1, x: 50, y: 50 })
    setUploadingPhoto(true)
    try {
      const url = await uploadFile(file, 'athletes/photos')
      setPhotoUrl(url)
      setValue('photoUrl', url)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload photo échoué :', err)
      toast.error(
        `Impossible d'uploader la photo${err instanceof Error ? ` : ${err.message}` : ''}.`
      )
      setPhotoUrl(initialData?.photoUrl ?? null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleBannerChange(file: File | undefined) {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setBannerUrl(previewUrl)
    setValue('bannerConfig', { ...bannerConfig, mode: 'photo', zoom: 1, x: 50, y: 50 })
    setUploadingBanner(true)
    try {
      const url = await uploadFile(file, 'athletes/banners')
      setBannerUrl(url)
      setValue('bannerUrl', url)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload bannière échoué :', err)
      toast.error(
        `Impossible d'uploader la bannière${err instanceof Error ? ` : ${err.message}` : ''}.`
      )
      setBannerUrl(initialData?.bannerUrl ?? null)
    } finally {
      setUploadingBanner(false)
    }
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

    // Sync FFA déclenchée automatiquement côté serveur si un profil athle.fr est lié —
    // on informe juste du résultat, rien à cliquer.
    const ffaSync = mode === 'create' ? (data.ffaSync as FfaSyncResult | null) : null
    if (ffaSync) {
      if (ffaSync.error) {
        toast.warning(`Sync FFA : ${ffaSync.error}`)
      } else if (ffaSync.imported > 0 || ffaSync.podiumsImported > 0) {
        toast.success(
          `Sync FFA : ${ffaSync.imported} performance${ffaSync.imported > 1 ? 's' : ''} et ${ffaSync.podiumsImported} podium${ffaSync.podiumsImported > 1 ? 's' : ''} importés.`
        )
      }
    }

    router.push(`/athletes/${id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_400px]">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Identité */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionTitle icon={User} color="primary">
              Identité
            </SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <SelectValue placeholder="Non spécifié">
                      {(value: string | null) =>
                        ({ M: 'Homme', F: 'Femme', X: 'Autre' })[value ?? ''] ?? 'Non spécifié'
                      }
                    </SelectValue>
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
                <Input
                  id="licenseNumber"
                  placeholder="Ex : 123456"
                  {...register('licenseNumber')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ffaProfileUrl">URL profil athle.fr</Label>
                <Input
                  id="ffaProfileUrl"
                  placeholder="https://www.athle.fr/athletes/XXXXX/resultats"
                  {...register('ffaProfileUrl')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Historique FFA à synchroniser</Label>
                <Select
                  value={ffaSyncSinceYear ? String(ffaSyncSinceYear) : NONE_VALUE}
                  onValueChange={(v) =>
                    setValue('ffaSyncSinceYear', v === NONE_VALUE ? null : Number(v))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tout l'historique">
                      {(value: string | null) =>
                        !value || value === NONE_VALUE
                          ? "Tout l'historique"
                          : `Depuis la saison ${value}/${Number(value) + 1}`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Tout l&apos;historique</SelectItem>
                    {ffaSyncSeasonOptions.map((s) => (
                      <SelectItem key={s.value} value={String(s.value)}>
                        Depuis la saison {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les performances antérieures à cette saison ne seront pas importées lors des
                  prochaines synchronisations FFA.
                </p>
              </div>
            </div>
          </section>

          {/* Spécialités */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionTitle icon={ListChecks} color="orange">
              Spécialités
            </SectionTitle>
            <div className="space-y-4">
              {Object.entries(ATHLETE_SPECIALTIES).map(([category, options]) => (
                <div key={category} className="rounded-xl bg-muted/40 p-3.5">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{category}</p>
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
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Ordre & couleurs</p>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Glisse une discipline pour changer l&apos;ordre d&apos;affichage sur ton profil.
                </p>
                <Reorder.Group
                  axis="y"
                  values={disciplines}
                  onReorder={(next) => setValue('disciplines', next)}
                  className="space-y-2"
                >
                  {disciplines.map((d, i) => (
                    <DisciplineReorderItem
                      key={d}
                      discipline={d}
                      color={disciplineColors[d] ?? defaultDisciplineColor(i)}
                      onColorChange={(c) =>
                        setValue('disciplineColors', { ...disciplineColors, [d]: c })
                      }
                    />
                  ))}
                </Reorder.Group>
              </div>
            )}
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6 xl:sticky xl:top-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionTitle icon={ImageIcon} color="pink">
              Apparence du profil
            </SectionTitle>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Photo de profil</Label>
                {photoUrl ? (
                  <div className="mx-auto max-w-40">
                    <ImagePositionEditor
                      src={photoUrl}
                      aspect="1/1"
                      shape="circle"
                      config={photoConfig}
                      onChange={(c) => setValue('photoConfig', c)}
                    />
                  </div>
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    Aucune
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                    disabled={uploadingPhoto}
                    onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                  />
                  {uploadingPhoto && (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                  {photoUrl && !uploadingPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setPhotoUrl(null)
                        setValue('photoUrl', null)
                        setValue('photoConfig', {})
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-5">
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                        disabled={uploadingBanner}
                        onChange={(e) => handleBannerChange(e.target.files?.[0])}
                      />
                      {uploadingBanner && (
                        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {bannerUrl && (
                      <ImagePositionEditor
                        src={bannerUrl}
                        aspect="3/1"
                        config={bannerConfig}
                        onChange={(c) => setValue('bannerConfig', { ...bannerConfig, ...c })}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading || uploadingPhoto || uploadingBanner}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'create' ? "Créer l'athlète" : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

/**
 * Ligne réordonnable d'une spécialité — le drag est limité à la poignée
 * (dragListener={false} + dragControls) plutôt qu'à toute la ligne : sinon,
 * sur mobile, tout swipe vertical sur la ligne (y compris sur les pastilles de
 * couleur) est intercepté comme un début de drag au lieu de faire défiler la
 * page, et le clic sur une couleur peut se confondre avec un drag (correctif
 * 2026-08-26 — même pattern que components/teams/relay-builder.tsx).
 */
function DisciplineReorderItem({
  discipline,
  color,
  onColorChange,
}: {
  discipline: string
  color: string
  onColorChange: (color: string) => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={discipline}
      dragListener={false}
      dragControls={controls}
      className="flex flex-col gap-2 rounded-xl bg-muted/40 p-2.5"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.35)' }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="-m-1 shrink-0 cursor-grab touch-none p-1 text-muted-foreground/60 active:cursor-grabbing"
          aria-label="Réordonner"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="min-w-0 flex-1 truncate text-xs font-medium select-none">
          {DISCIPLINE_LABELS[discipline] ?? discipline}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-6">
        {DEFAULT_DISCIPLINE_COLORS.map((c) => {
          const active = color === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={cn(
                'size-5 shrink-0 rounded-full transition-transform',
                active
                  ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card'
                  : 'hover:scale-105'
              )}
              style={{ background: c }}
              aria-label={c}
            />
          )
        })}
        {/* Couleur personnalisée (input type=color) désactivée pour l'instant à
            la demande de Maksen le 2026-08-25 — la palette de 12 couleurs
            suffit, à réévaluer plus tard. */}
      </div>
    </Reorder.Item>
  )
}

const SECTION_COLORS = {
  primary: 'from-primary to-primary/60 shadow-primary/25',
  orange: 'from-orange-500 to-amber-500 shadow-orange-500/25',
  pink: 'from-pink-500 to-rose-500 shadow-pink-500/25',
  slate: 'from-slate-500 to-slate-400 shadow-slate-500/20',
} as const

function SectionTitle({
  icon: Icon,
  color = 'primary',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  color?: keyof typeof SECTION_COLORS
  children: React.ReactNode
}) {
  return (
    <h2 className="mb-5 flex items-center gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
          SECTION_COLORS[color]
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="text-base font-extrabold tracking-tight">{children}</span>
    </h2>
  )
}
