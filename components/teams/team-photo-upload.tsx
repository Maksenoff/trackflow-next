'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2, X } from 'lucide-react'
import { uploadFile } from '@/lib/upload-file'
import { ImagePositionEditor, type CropConfig } from '@/components/athletes/image-position-editor'

export function TeamPhotoUpload({
  photoUrl,
  photoConfig,
  onPhotoChange,
  onConfigChange,
}: {
  photoUrl: string | null
  photoConfig: CropConfig
  onPhotoChange: (url: string | null) => void
  onConfigChange: (config: CropConfig) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file, 'teams/photos')
      onConfigChange({ zoom: 1, x: 50, y: 50 })
      onPhotoChange(url)
    } catch {
      toast.error("Impossible d'uploader l'image.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {photoUrl ? (
        <div className="max-w-40">
          <ImagePositionEditor
            src={photoUrl}
            aspect="1/1"
            shape="rect"
            config={photoConfig}
            onChange={onConfigChange}
          />
        </div>
      ) : (
        <div className="flex size-24 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-muted-foreground">
          <Camera className="size-6" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted">
          <Camera className="size-3.5" />
          {photoUrl ? 'Changer' : 'Ajouter une photo'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {uploading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        {photoUrl && !uploading && (
          <button
            type="button"
            onClick={() => {
              onPhotoChange(null)
              onConfigChange({})
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="size-3" />
            Retirer
          </button>
        )}
      </div>
    </div>
  )
}
