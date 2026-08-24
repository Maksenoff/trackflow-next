'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw, RotateCcw, Loader2 } from 'lucide-react'

// Lignes pleine largeur dans le menu déroulant "···" de ProfileHeader — plus de
// style "pill glassy" à part sur la bannière (correctif 2026-08-22 : ça créait
// une couleur différente des autres actions).
export function FfaSyncButtons({
  athleteId,
  showFullResync,
}: {
  athleteId: string
  showFullResync: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'sync' | 'resync' | null>(null)

  async function sync() {
    setLoading('sync')
    const res = await fetch(`/api/athletes/${athleteId}/sync-ffa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true }),
    })
    const data = await res.json()
    setLoading(null)

    if (!res.ok || data.error) {
      toast.error(data.error ?? 'Impossible de synchroniser avec la FFA.')
      return
    }
    const parts: string[] = []
    if (data.imported > 0) {
      parts.push(
        `${data.imported} performance${data.imported > 1 ? 's' : ''} importée${data.imported > 1 ? 's' : ''}`
      )
    }
    if (data.podiumsImported > 0) {
      parts.push(`${data.podiumsImported} podium${data.podiumsImported > 1 ? 's' : ''}`)
    }
    toast.success(parts.length > 0 ? parts.join(', ') + '.' : 'Déjà à jour, aucune nouveauté.')
    router.refresh()
  }

  async function fullResync() {
    setLoading('resync')
    const res = await fetch(`/api/athletes/${athleteId}/full-resync-ffa`, { method: 'POST' })
    const data = await res.json()
    setLoading(null)

    if (!res.ok || data.error) {
      toast.error(data.error ?? 'Impossible de resynchroniser avec la FFA.')
      return
    }
    toast.success(
      `Resynchronisation complète : ${data.imported} performance(s), ${data.podiumsImported} podium(s) réimporté(s).`
    )
    router.refresh()
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={sync}
        disabled={loading !== null}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-60"
      >
        {loading === 'sync' ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <RefreshCw className="size-4 text-muted-foreground" />
        )}
        Sync FFA
      </button>
      {showFullResync && (
        <button
          type="button"
          onClick={fullResync}
          disabled={loading !== null}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-60"
          title="Supprime toutes les performances FFA et les réimporte depuis zéro"
        >
          {loading === 'resync' ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <RotateCcw className="size-4 text-muted-foreground" />
          )}
          Resync complet
        </button>
      )}
    </div>
  )
}
