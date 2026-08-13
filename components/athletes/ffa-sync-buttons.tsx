'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw, RotateCcw, Loader2 } from 'lucide-react'

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
    toast.success(
      data.imported > 0
        ? `${data.imported} performance${data.imported > 1 ? 's' : ''} importée${data.imported > 1 ? 's' : ''}.`
        : 'Déjà à jour, aucune nouvelle performance.'
    )
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
    toast.success(`Resynchronisation complète : ${data.imported} performance(s) réimportée(s).`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45 disabled:opacity-60 sm:px-3"
      >
        {loading === 'sync' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        <span className="hidden sm:inline">Sync FFA</span>
      </button>
      {showFullResync && (
        <button
          type="button"
          onClick={fullResync}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/45 disabled:opacity-60 sm:px-3"
          title="Supprime toutes les performances FFA et les réimporte depuis zéro"
        >
          {loading === 'resync' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          <span className="hidden sm:inline">Resync complet</span>
        </button>
      )}
    </div>
  )
}
