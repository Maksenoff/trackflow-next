'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, X, GripVertical, Camera, Upload, Search, Check, ChevronDown } from 'lucide-react'
import { ImagePositionEditor } from '@/components/athletes/image-position-editor'
import { DeleteAthleteButton } from '@/components/athletes/delete-athlete-button'
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

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function Field({
  label,
  hint,
  span2,
  children,
}: {
  label: string
  hint?: string
  span2?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col', span2 && 'sm:col-span-2')}>
      <label className="mb-2 text-[11px] tracking-[0.06em]" style={{ color: 'var(--nu-dim)' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-2 text-[11.5px] leading-[1.55]" style={{ color: 'var(--nu-dim)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'nu-field h-11 w-full rounded-[12px] px-3.5 text-sm outline-none transition-colors'
const inputStyle = {
  background: 'var(--nu-bg)',
  border: '1px solid var(--nu-line)',
  color: 'var(--nu-txt)',
}

function NewSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(inputClass, 'flex items-center justify-between text-left')}
        style={inputStyle}
      >
        <span className={current ? undefined : 'opacity-60'}>{current?.label ?? placeholder}</span>
        <ChevronDown className="size-3.5 shrink-0" style={{ color: 'var(--nu-dim)' }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-[12px] p-1 shadow-xl"
            style={{ background: 'var(--nu-surf2)', border: '1px solid var(--nu-line)' }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left text-sm transition-colors hover:[background:var(--nu-bg)]"
                style={{ color: 'var(--nu-txt)' }}
              >
                {o.label}
                {o.value === value && (
                  <Check className="size-3.5" style={{ color: 'var(--nu-acc)' }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function NewAthleteForm({
  athleteId,
  fullName,
  initialData,
  earliestSeasonStart,
}: {
  athleteId: string
  fullName: string
  initialData: Partial<AthleteFormValues>
  earliestSeasonStart?: number
}) {
  const router = useRouter()
  const ffaSyncSeasonOptions = buildFfaSyncSeasonOptions(earliestSeasonStart)
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData.photoUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialData.bannerUrl ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [dpQuery, setDpQuery] = useState('')
  const [dpGroup, setDpGroup] = useState(0)
  const [openPalette, setOpenPalette] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
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
  const dirtyCount = Object.keys(dirtyFields).length

  const groups = useMemo(() => Object.entries(ATHLETE_SPECIALTIES), [])
  const dpOptions = useMemo(() => {
    if (dpQuery.trim()) {
      const q = norm(dpQuery)
      const out: { label: string; value: string }[] = []
      groups.forEach(([, options]) => {
        Object.entries(options).forEach(([label, value]) => {
          if (norm(label).includes(q)) out.push({ label, value })
        })
      })
      return out
    }
    return Object.entries(groups[dpGroup][1]).map(([label, value]) => ({ label, value }))
  }, [dpQuery, dpGroup, groups])

  function toggleDiscipline(value: string) {
    const wasSelected = disciplines.includes(value)
    const next = wasSelected ? disciplines.filter((d) => d !== value) : [...disciplines, value]
    setValue('disciplines', next, { shouldDirty: true })
    if (wasSelected) {
      setValue(
        'disciplineColors',
        Object.fromEntries(Object.entries(disciplineColors).filter(([key]) => key !== value)),
        { shouldDirty: true }
      )
    } else if (!disciplineColors[value]) {
      setValue(
        'disciplineColors',
        { ...disciplineColors, [value]: defaultDisciplineColor(next.length - 1) },
        { shouldDirty: true }
      )
    }
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPhotoUrl(previewUrl)
    setValue('photoConfig', { zoom: 1, x: 50, y: 50 }, { shouldDirty: true })
    setUploadingPhoto(true)
    try {
      const url = await uploadFile(file, 'athletes/photos')
      setPhotoUrl(url)
      setValue('photoUrl', url, { shouldDirty: true })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload photo échoué :', err)
      toast.error(
        `Impossible d'uploader la photo${err instanceof Error ? ` : ${err.message}` : ''}.`
      )
      setPhotoUrl(initialData.photoUrl ?? null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleBannerChange(file: File | undefined) {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setBannerUrl(previewUrl)
    setValue(
      'bannerConfig',
      { ...bannerConfig, mode: 'photo', zoom: 1, x: 50, y: 50 },
      { shouldDirty: true }
    )
    setUploadingBanner(true)
    try {
      const url = await uploadFile(file, 'athletes/banners')
      setBannerUrl(url)
      setValue('bannerUrl', url, { shouldDirty: true })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload bannière échoué :', err)
      toast.error(
        `Impossible d'uploader la bannière${err instanceof Error ? ` : ${err.message}` : ''}.`
      )
      setBannerUrl(initialData.bannerUrl ?? null)
    } finally {
      setUploadingBanner(false)
    }
  }

  async function onSubmit(values: AthleteFormValues) {
    setLoading(true)
    const res = await fetch(`/api/athletes/${athleteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error("Une erreur est survenue lors de l'enregistrement.")
      return
    }
    const data = (await res.json()) as { ffaSync?: FfaSyncResult | null }
    toast.success('Profil mis à jour.')
    if (data.ffaSync?.error) toast.warning(`Sync FFA : ${data.ffaSync.error}`)
    router.push(`/athletes/${athleteId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className="sticky top-0 z-30 mb-5 flex flex-wrap items-center justify-between gap-5 py-3.5"
        style={{ background: 'var(--nu-bg)', borderBottom: '1px solid var(--nu-line)' }}
      >
        <div>
          <h1
            className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]"
            style={{ color: 'var(--nu-txt)' }}
          >
            Modifier {fullName}
          </h1>
          {dirtyCount > 0 && (
            <div
              className="mt-1.5 flex items-center gap-2 text-[13px]"
              style={{ color: 'var(--nu-dim)' }}
            >
              <span
                className="nu-pulse-dot size-[7px] shrink-0 rounded-full"
                style={{ background: 'var(--lact,#ffb020)' }}
              />
              {dirtyCount} modification{dirtyCount > 1 ? 's' : ''} non enregistrée
              {dirtyCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DeleteAthleteButton athleteId={athleteId} />
          <button
            type="button"
            onClick={() => router.back()}
            className="nu-tool inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[13.5px] transition-colors"
            style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || uploadingPhoto || uploadingBanner}
            className="nu-sheen inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[13.5px] font-semibold disabled:opacity-60"
            style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section
            className="rounded-[20px] p-6"
            style={{
              background: 'var(--nu-surf)',
              border: '1px solid var(--nu-line)',
              boxShadow: 'inset 0 1px 0 var(--nu-rim)',
            }}
          >
            <h2
              className="mb-5 text-[15px] font-bold tracking-[-0.01em]"
              style={{ color: 'var(--nu-txt)' }}
            >
              Identité
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Prénom">
                <input className={inputClass} style={inputStyle} {...register('firstName')} />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </Field>
              <Field label="Nom">
                <input className={inputClass} style={inputStyle} {...register('lastName')} />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </Field>
              <Field label="Date de naissance">
                <input
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                  {...register('birthDate')}
                />
              </Field>
              <Field label="Genre">
                <NewSelect
                  value={gender ?? ''}
                  onChange={(v) =>
                    setValue('gender', v as AthleteFormValues['gender'], { shouldDirty: true })
                  }
                  options={[
                    { value: 'M', label: 'Homme' },
                    { value: 'F', label: 'Femme' },
                    { value: 'X', label: 'Autre' },
                  ]}
                  placeholder="Non spécifié"
                />
              </Field>
              <Field label="Numéro de licence">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Ex : 123456"
                  {...register('licenseNumber')}
                />
              </Field>
              <Field label="Profil athle.fr">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="https://www.athle.fr/athletes/XXXXX/resultats"
                  {...register('ffaProfileUrl')}
                />
              </Field>
              <Field
                label="Historique FFA à synchroniser"
                span2
                hint="Les performances antérieures à cette saison ne seront pas importées lors des prochaines synchronisations FFA."
              >
                <NewSelect
                  value={ffaSyncSinceYear ? String(ffaSyncSinceYear) : NONE_VALUE}
                  onChange={(v) =>
                    setValue('ffaSyncSinceYear', v === NONE_VALUE ? null : Number(v), {
                      shouldDirty: true,
                    })
                  }
                  options={[
                    { value: NONE_VALUE, label: "Tout l'historique" },
                    ...ffaSyncSeasonOptions.map((s) => ({
                      value: String(s.value),
                      label: `Depuis la saison ${s.label}`,
                    })),
                  ]}
                />
              </Field>
            </div>
          </section>

          <section
            className="rounded-[20px] p-6"
            style={{
              background: 'var(--nu-surf)',
              border: '1px solid var(--nu-line)',
              boxShadow: 'inset 0 1px 0 var(--nu-rim)',
            }}
          >
            <h2
              className="mb-5 flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.01em]"
              style={{ color: 'var(--nu-txt)' }}
            >
              Spécialités
              {disciplines.length > 0 && (
                <span className="text-[11.5px] font-normal" style={{ color: 'var(--nu-dim)' }}>
                  {disciplines.length} discipline{disciplines.length > 1 ? 's' : ''}
                </span>
              )}
            </h2>

            <div
              className="rounded-[16px] p-3.5"
              style={{ background: 'var(--nu-bg)', border: '1px solid var(--nu-line)' }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <label
                  className="flex h-9 flex-[0_0_220px] items-center gap-2 rounded-[10px] px-3 transition-colors"
                  style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
                >
                  <Search className="size-3.5 shrink-0" style={{ color: 'var(--nu-dim)' }} />
                  <input
                    value={dpQuery}
                    onChange={(e) => setDpQuery(e.target.value)}
                    placeholder="Rechercher une épreuve…"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    style={{ color: 'var(--nu-txt)' }}
                  />
                </label>
                <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
                  {groups.map(([name, options], i) => {
                    const count = Object.values(options).filter((v) =>
                      disciplines.includes(v)
                    ).length
                    const active = i === dpGroup && !dpQuery
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setDpGroup(i)
                          setDpQuery('')
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12.5px] whitespace-nowrap transition-colors"
                        style={{
                          background: active ? 'var(--nu-surf)' : 'transparent',
                          color: active ? 'var(--nu-txt)' : 'var(--nu-dim)',
                          boxShadow: active
                            ? 'inset 0 0 0 1px color-mix(in srgb, var(--nu-acc) 35%, transparent)'
                            : undefined,
                        }}
                      >
                        {name}
                        {count > 0 && (
                          <span
                            className="flex min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
                            style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex min-h-[38px] flex-wrap gap-1.5">
                {dpOptions.length === 0 && (
                  <p className="px-0.5 py-2 text-[12.5px]" style={{ color: 'var(--nu-dim)' }}>
                    Aucune épreuve ne correspond.
                  </p>
                )}
                {dpOptions.map(({ label, value }) => {
                  const active = disciplines.includes(value)
                  const color = disciplineColors[value] ?? 'var(--nu-acc)'
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDiscipline(value)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium transition-transform hover:-translate-y-px"
                      style={
                        active
                          ? {
                              color,
                              background: `color-mix(in srgb, ${color} 16%, transparent)`,
                              border: '1px solid transparent',
                            }
                          : { color: 'var(--nu-dim)', border: '1px solid var(--nu-line)' }
                      }
                    >
                      {active && <Check className="size-3" />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {disciplines.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--nu-line)' }}>
                <p className="mb-3 text-[11.5px]" style={{ color: 'var(--nu-dim)' }}>
                  Glisse une discipline pour changer son ordre d&apos;affichage sur le profil.
                </p>
                <Reorder.Group
                  axis="y"
                  values={disciplines}
                  onReorder={(next) => setValue('disciplines', next, { shouldDirty: true })}
                  className="flex flex-col gap-2"
                >
                  {disciplines.map((d, i) => (
                    <NewDisciplineRow
                      key={d}
                      discipline={d}
                      color={disciplineColors[d] ?? defaultDisciplineColor(i)}
                      position={i + 1}
                      paletteOpen={openPalette === d}
                      onTogglePalette={() => setOpenPalette((cur) => (cur === d ? null : d))}
                      onColorChange={(c) => {
                        setValue(
                          'disciplineColors',
                          { ...disciplineColors, [d]: c },
                          { shouldDirty: true }
                        )
                        setOpenPalette(null)
                      }}
                      onRemove={() => toggleDiscipline(d)}
                    />
                  ))}
                </Reorder.Group>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-[76px]">
          <section
            className="rounded-[20px] p-6"
            style={{
              background: 'var(--nu-surf)',
              border: '1px solid var(--nu-line)',
              boxShadow: 'inset 0 1px 0 var(--nu-rim)',
            }}
          >
            <h2
              className="mb-5 text-[15px] font-bold tracking-[-0.01em]"
              style={{ color: 'var(--nu-txt)' }}
            >
              Apparence
            </h2>

            <p className="mb-3 text-[11px] tracking-[0.06em]" style={{ color: 'var(--nu-dim)' }}>
              Photo de profil
            </p>
            {photoUrl ? (
              <div className="mx-auto max-w-40">
                <ImagePositionEditor
                  src={photoUrl}
                  aspect="1/1"
                  shape="circle"
                  config={photoConfig}
                  onChange={(c) => setValue('photoConfig', c, { shouldDirty: true })}
                />
              </div>
            ) : (
              <div
                className="mx-auto flex size-24 items-center justify-center rounded-full text-xs"
                style={{ background: 'var(--nu-surf2)', color: 'var(--nu-dim)' }}
              >
                Aucune
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-3">
              <label
                className="nu-tool inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
              >
                <Camera className="size-3.5" />
                {photoUrl ? 'Changer' : 'Ajouter une photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </label>
              {uploadingPhoto && (
                <Loader2
                  className="size-4 shrink-0 animate-spin"
                  style={{ color: 'var(--nu-dim)' }}
                />
              )}
              {photoUrl && !uploadingPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null)
                    setValue('photoUrl', null, { shouldDirty: true })
                    setValue('photoConfig', {}, { shouldDirty: true })
                  }}
                  className="flex items-center gap-1 text-xs transition-colors hover:[color:var(--nu-ko)]"
                  style={{ color: 'var(--nu-dim)' }}
                >
                  <X className="size-3" />
                  Retirer
                </button>
              )}
            </div>

            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--nu-line)' }}>
              <p className="mb-3 text-[11px] tracking-[0.06em]" style={{ color: 'var(--nu-dim)' }}>
                Bannière
              </p>
              <div
                className="mb-3.5 inline-flex rounded-full p-0.5 text-xs"
                style={{ background: 'var(--nu-bg)', border: '1px solid var(--nu-line)' }}
              >
                {(['pattern', 'photo'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setValue('bannerConfig', { ...bannerConfig, mode: m }, { shouldDirty: true })
                    }
                    className="rounded-full px-3 py-1.5 font-medium transition-colors"
                    style={
                      bannerConfig.mode === m
                        ? { background: 'var(--nu-acc)', color: '#fff' }
                        : { color: 'var(--nu-dim)' }
                    }
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
                        onClick={() =>
                          setValue(
                            'bannerConfig',
                            { ...bannerConfig, color: c },
                            { shouldDirty: true }
                          )
                        }
                        className="size-7 rounded-full border-2 transition-transform"
                        style={{
                          background: c,
                          borderColor: bannerConfig.color === c ? 'var(--nu-txt)' : 'transparent',
                          transform: bannerConfig.color === c ? 'scale(1.1)' : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="h-16 w-full rounded-[12px]"
                    style={{
                      background: `linear-gradient(135deg, ${bannerConfig.color ?? BANNER_COLORS[0]}, ${bannerConfig.color ?? BANNER_COLORS[0]}66)`,
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label
                    className="nu-tool inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
                  >
                    <Upload className="size-3.5" />
                    {bannerUrl ? 'Changer la photo' : 'Choisir une photo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                      className="hidden"
                      disabled={uploadingBanner}
                      onChange={(e) => handleBannerChange(e.target.files?.[0])}
                    />
                  </label>
                  {uploadingBanner && (
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      style={{ color: 'var(--nu-dim)' }}
                    />
                  )}
                  {bannerUrl && (
                    <ImagePositionEditor
                      src={bannerUrl}
                      aspect="3/1"
                      config={bannerConfig}
                      onChange={(c) =>
                        setValue('bannerConfig', { ...bannerConfig, ...c }, { shouldDirty: true })
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}

function NewDisciplineRow({
  discipline,
  color,
  position,
  paletteOpen,
  onTogglePalette,
  onColorChange,
  onRemove,
}: {
  discipline: string
  color: string
  position: number
  paletteOpen: boolean
  onTogglePalette: () => void
  onColorChange: (color: string) => void
  onRemove: () => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={discipline}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.35)' }}
      className="flex items-center gap-3 rounded-[13px] px-3.5 py-2.5"
      style={{ background: 'var(--nu-bg)', border: '1px solid var(--nu-line)' }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="-m-1 shrink-0 cursor-grab touch-none p-1 active:cursor-grabbing"
        style={{ color: 'var(--nu-dim)' }}
        aria-label="Réordonner"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-3.5 shrink-0 text-[11px]" style={{ color: 'var(--nu-dim)' }}>
        {position}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13.5px] select-none"
        style={{ color: 'var(--nu-txt)' }}
      >
        {DISCIPLINE_LABELS[discipline] ?? discipline}
      </span>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onTogglePalette}
          className="size-6 rounded-[8px] transition-transform hover:scale-110"
          style={{ background: color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}
          aria-label="Couleur"
        />
        <AnimatePresence>
          {paletteOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full right-0 z-20 mt-1.5 grid grid-cols-6 gap-1.5 rounded-[14px] p-2.5 shadow-xl"
              style={{ background: 'var(--nu-surf2)', border: '1px solid var(--nu-line)' }}
            >
              {DEFAULT_DISCIPLINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColorChange(c)}
                  className="size-5 rounded-[7px] transition-transform hover:scale-[1.18]"
                  style={{
                    background: c,
                    boxShadow:
                      c === color ? '0 0 0 2px var(--nu-surf2), 0 0 0 4px currentColor' : undefined,
                    color: c,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-6 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:[background:color-mix(in_srgb,var(--nu-ko)_15%,transparent)] hover:[color:var(--nu-ko)]"
        style={{ color: 'var(--nu-dim)' }}
        aria-label="Retirer"
      >
        <X className="size-3.5" />
      </button>
    </Reorder.Item>
  )
}
