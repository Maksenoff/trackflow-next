'use client'

import { useEffect, useState } from 'react'
import { Loader2, User, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Breakdown = { id: string; label: string; voters: string[] }[]

const CORNER_STYLES = {
  blue: { text: 'text-sky-500', bg: 'bg-sky-500/5', border: 'border-sky-500/20' },
  rose: { text: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
} as const

/** Détail "qui a voté pour quoi" — ouvert au clic sur le total de votes d'un
 * duel (demande explicite de Maksen le 2026-08-29). Chargé à la demande
 * (pas dans la liste principale) pour ne pas alourdir /votes avec les noms
 * de tous les votants de tous les duels a chaque chargement de page. */
export function VoteBreakdownDialog({
  open,
  onOpenChange,
  pollId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pollId: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Breakdown | null>(null)

  useEffect(() => {
    if (!open || !pollId) {
      setData(null)
      return
    }
    setLoading(true)
    fetch(`/api/polls/${pollId}/votes`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { options: Breakdown }) => setData(json.options))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [open, pollId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="size-4 text-primary" />
            Détail des votes
          </DialogTitle>
          <DialogDescription>Qui a voté pour quoi.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data?.map((option, i) => {
              const styles = CORNER_STYLES[i === 0 ? 'blue' : 'rose']
              return (
                <div
                  key={option.id}
                  className={cn('rounded-2xl border-2 p-3.5', styles.border, styles.bg)}
                >
                  <div className={cn('mb-2 text-sm font-bold', styles.text)}>{option.label}</div>
                  {option.voters.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun vote.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {option.voters.map((name, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-sm text-foreground">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
