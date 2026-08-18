'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fullName } from '@/lib/athlete'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'

export type PickableAthlete = AthleteAvatarData & { id: string }

export function AthletePickerDialog({
  open,
  onOpenChange,
  teamId,
  allAthletes,
  currentMemberIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  allAthletes: PickableAthlete[]
  currentMemberIds: string[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [addedIds, setAddedIds] = useState<string[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setAddedIds([])
    }
  }, [open])

  const available = useMemo(() => {
    const excluded = new Set([...currentMemberIds, ...addedIds])
    const q = search.trim().toLowerCase()
    return allAthletes
      .filter((a) => !excluded.has(a.id))
      .filter((a) => !q || fullName(a.firstName, a.lastName).toLowerCase().includes(q))
  }, [allAthletes, currentMemberIds, addedIds, search])

  async function handleAdd(athleteId: string) {
    setPendingId(athleteId)
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId }),
    })
    setPendingId(null)
    if (!res.ok) {
      toast.error("Impossible d'ajouter cet athlète.")
      return
    }
    setAddedIds((ids) => [...ids, athleteId])
  }

  function handleOpenChange(next: boolean) {
    if (!next && addedIds.length > 0) router.refresh()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter des athlètes</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un athlète…"
            className="pl-8"
          />
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {available.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {allAthletes.length === 0 ? 'Aucun athlète.' : 'Aucun résultat.'}
            </p>
          ) : (
            available.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleAdd(a.id)}
                disabled={pendingId === a.id}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <AthleteAvatar athlete={a} className="size-9" />
                <span className="flex-1 truncate text-sm font-medium">
                  {fullName(a.firstName, a.lastName)}
                </span>
                {pendingId === a.id ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="size-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
