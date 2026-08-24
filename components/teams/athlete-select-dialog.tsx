'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fullName } from '@/lib/athlete'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'

export type SelectableAthlete = AthleteAvatarData & {
  id: string
  licenseNumber?: string | null
}

/**
 * Sélection locale (pas d'appel API) — le formulaire équipe (TeamForm, création
 * et édition) envoie tout en un seul submit, jamais un ajout immédiat.
 */
export function AthleteSelectDialog({
  open,
  onOpenChange,
  allAthletes,
  excludeIds,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allAthletes: SelectableAthlete[]
  excludeIds: string[]
  onSelect: (athlete: SelectableAthlete) => void
}) {
  const [search, setSearch] = useState('')

  const available = useMemo(() => {
    const excluded = new Set(excludeIds)
    const q = search.trim().toLowerCase()
    return allAthletes
      .filter((a) => !excluded.has(a.id))
      .filter((a) => !q || fullName(a.firstName, a.lastName).toLowerCase().includes(q))
  }, [allAthletes, excludeIds, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un athlète</DialogTitle>
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
                onClick={() => {
                  onSelect(a)
                  onOpenChange(false)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <AthleteAvatar athlete={a} className="size-9" />
                <span className="flex-1 truncate text-sm font-medium">
                  {fullName(a.firstName, a.lastName)}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
