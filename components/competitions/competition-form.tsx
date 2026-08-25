'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { BackButton } from '@/components/ui/back-button'
import { TypePillPicker, type ColorTypeOption } from '@/components/calendar/type-pill-picker'
import { DisciplinePicker } from '@/components/competitions/discipline-picker'
import { uploadFile } from '@/lib/upload-file'
import { toDateInputValue } from '@/lib/calendar-grid'
import { cn } from '@/lib/utils'

const MAX_FILE_BYTES = 8 * 1024 * 1024

export type CompetitionFormValues = {
  title: string
  date: Date
  location: string | null
  competitionTypeId: string | null
  websiteUrl: string | null
  documentUrl: string | null
  schedulesUrl: string | null
  description: string | null
  availableDisciplines: string[]
  requestExpectedPerf: boolean
}

export function CompetitionForm({
  mode,
  competitionId,
  initialData,
  initialDate,
  competitionTypes,
}: {
  mode: 'create' | 'edit'
  competitionId?: string
  initialData?: CompetitionFormValues
  initialDate?: Date
  competitionTypes: ColorTypeOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [date, setDate] = useState(toDateInputValue(initialData?.date ?? initialDate ?? new Date()))
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [competitionTypeId, setCompetitionTypeId] = useState<string | undefined>(
    initialData?.competitionTypeId ?? undefined
  )
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl ?? '')
  const [documentUrl, setDocumentUrl] = useState<string | null>(initialData?.documentUrl ?? null)
  const [schedulesUrl, setSchedulesUrl] = useState<string | null>(initialData?.schedulesUrl ?? null)
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [requestExpectedPerf, setRequestExpectedPerf] = useState(
    initialData?.requestExpectedPerf ?? false
  )
  const [restricted, setRestricted] = useState((initialData?.availableDisciplines.length ?? 0) > 0)
  const [availableDisciplines, setAvailableDisciplines] = useState<string[]>(
    initialData?.availableDisciplines ?? []
  )
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadingSchedules, setUploadingSchedules] = useState(false)

  async function handleFile(
    file: File | undefined,
    setter: (url: string | null) => void,
    setUploading: (v: boolean) => void
  ) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Fichier trop volumineux (8 Mo max).')
      return
    }
    setUploading(true)
    try {
      setter(await uploadFile(file, 'competitions/documents'))
    } catch {
      toast.error("Impossible d'uploader ce fichier.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !date) return
    setLoading(true)
    const res = await fetch(
      mode === 'edit' ? `/api/competitions/${competitionId}` : '/api/competitions',
      {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          location: location || null,
          competitionTypeId: competitionTypeId ?? null,
          websiteUrl: websiteUrl || null,
          documentUrl,
          schedulesUrl,
          description: description || null,
          availableDisciplines: restricted ? availableDisciplines : [],
          requestExpectedPerf,
        }),
      }
    )
    setLoading(false)
    if (!res.ok) {
      toast.error(
        mode === 'edit'
          ? 'Impossible de mettre à jour la compétition.'
          : 'Impossible de créer la compétition.'
      )
      return
    }
    const body = (await res.json()) as { id: string }
    toast.success(mode === 'edit' ? 'Compétition mise à jour.' : 'Compétition créée.')
    router.push(`/competitions/${mode === 'edit' ? competitionId : body.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8 xl:p-10">
      <BackButton label="Retour au calendrier" />

      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          {mode === 'edit' ? 'Modifier la compétition' : 'Nouvelle compétition'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'edit'
            ? 'Mettez à jour les informations de la compétition.'
            : 'Ajoutez une compétition au calendrier.'}
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="competition-title">Nom de la compétition *</Label>
            <Input
              id="competition-title"
              autoFocus
              className="h-11 text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Meeting régional indoor"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="competition-date">Date *</Label>
              <Input
                id="competition-date"
                type="date"
                className="h-11"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competition-location">Lieu</Label>
              <Input
                id="competition-location"
                className="h-11"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex : Liévin"
              />
            </div>
          </div>

          <TypePillPicker
            label="Type de compétition"
            types={competitionTypes}
            value={competitionTypeId}
            onChange={setCompetitionTypeId}
          />

          <div className="space-y-1.5">
            <Label htmlFor="competition-website">Site officiel</Label>
            <Input
              id="competition-website"
              className="h-11"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="competition-document">Circulaire (PDF ou image)</Label>
              <FileField
                id="competition-document"
                value={documentUrl}
                loading={uploadingDocument}
                onFile={(f) => handleFile(f, setDocumentUrl, setUploadingDocument)}
                onClear={() => setDocumentUrl(null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competition-schedules">Horaires (PDF ou image)</Label>
              <FileField
                id="competition-schedules"
                value={schedulesUrl}
                loading={uploadingSchedules}
                onFile={(f) => handleFile(f, setSchedulesUrl, setUploadingSchedules)}
                onClear={() => setSchedulesUrl(null)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="competition-description">Notes</Label>
            <Textarea
              id="competition-description"
              rows={8}
              className="min-h-40 resize-y text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informations complémentaires, consignes, programme..."
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
          className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Performances attendues</p>
              <p className="text-xs text-muted-foreground">
                Les athlètes renseignent une performance cible par discipline lors de
                l&apos;inscription.
              </p>
            </div>
            <Switch checked={requestExpectedPerf} onCheckedChange={setRequestExpectedPerf} />
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-sm font-semibold">Disciplines disponibles</p>
            <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
              {(
                [
                  { key: 'all', label: 'Toutes les disciplines' },
                  { key: 'restricted', label: 'Sélection manuelle' },
                ] as const
              ).map((opt) => {
                const isActive = (opt.key === 'restricted') === restricted
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRestricted(opt.key === 'restricted')}
                    className={cn(
                      'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="competition-discipline-mode"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      />
                    )}
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {restricted && (
                <motion.div
                  key="restricted"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="max-h-[28rem] space-y-2 overflow-y-auto pr-1"
                >
                  <DisciplinePicker
                    value={availableDisciplines}
                    onChange={setAvailableDisciplines}
                    allowCustom
                  />
                  {availableDisciplines.length === 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      Sélectionne au moins une discipline ou passe en mode &quot;Toutes les
                      disciplines&quot;.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            uploadingDocument ||
            uploadingSchedules ||
            !title.trim() ||
            (restricted && availableDisciplines.length === 0)
          }
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'edit' ? 'Enregistrer' : 'Créer la compétition'}
        </Button>
      </div>
    </div>
  )
}

function FileField({
  id,
  value,
  loading,
  onFile,
  onClear,
}: {
  id: string
  value: string | null
  loading?: boolean
  onFile: (file: File | undefined) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          'flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Upload className="size-4 shrink-0" />
        )}
        <span className="truncate">
          {loading ? 'Envoi en cours…' : value ? 'Fichier sélectionné' : 'Choisir un fichier'}
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        disabled={loading}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-muted-foreground hover:text-destructive hover:underline"
        >
          Retirer le fichier
        </button>
      )}
    </div>
  )
}
