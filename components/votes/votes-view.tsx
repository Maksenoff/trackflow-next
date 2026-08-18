'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  Minus,
  Swords,
  Timer,
  Trash2,
  Trophy,
  Vote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PollStatus } from '@/lib/polls-data'

export type PollOptionItem = {
  id: string
  label: string
  votes: number | null
}

export type PollItem = {
  id: string
  createdAt: string
  startsAt: string
  expiresAt: string
  status: PollStatus
  myVote: string | null
  totalVotes: number
  options: PollOptionItem[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeLeft(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Terminé'
  const diffH = Math.round(diffMs / (60 * 60 * 1000))
  if (diffH < 24) return `${diffH}h restantes`
  return `${Math.round(diffH / 24)}j restants`
}

function timeUntilStart(startsAt: string): string {
  const diffMs = new Date(startsAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Bientôt'
  const diffH = Math.round(diffMs / (60 * 60 * 1000))
  if (diffH < 24) return `dans ${diffH}h`
  return `dans ${Math.round(diffH / 24)}j`
}

export function VotesView({
  polls: initial,
  canManage,
}: {
  polls: PollItem[]
  canManage: boolean
}) {
  const router = useRouter()
  const [polls, setPolls] = useState(initial)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const scheduled = polls.filter((p) => p.status === 'scheduled')
  const active = polls.filter((p) => p.status === 'active')
  const expired = polls.filter((p) => p.status === 'expired')

  async function vote(pollId: string, optionId: string) {
    const prev = polls
    setPolls((ps) => ps.map((p) => (p.id === pollId ? { ...p, myVote: optionId } : p)))
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    })
    if (!res.ok) {
      setPolls(prev)
      toast.error('Impossible de voter.')
      return
    }
    // Le serveur renvoie les compteurs à jour : affichage immédiat des % en direct,
    // sans attendre le router.refresh() (qui reste utile pour la persistance inter-pages).
    const data = (await res.json()) as {
      totalVotes: number
      options: { id: string; votes: number }[]
    }
    setPolls((ps) =>
      ps.map((p) =>
        p.id === pollId
          ? {
              ...p,
              myVote: optionId,
              totalVotes: data.totalVotes,
              options: p.options.map((o) => ({
                ...o,
                votes: data.options.find((d) => d.id === o.id)?.votes ?? o.votes,
              })),
            }
          : p
      )
    )
    // Invalide le cache de navigation : sans ça, quitter /votes puis y revenir peut
    // réafficher un snapshot pré-vote et donner l'impression que le vote ne tient pas.
    router.refresh()
  }

  async function cancelPoll(pollId: string) {
    if (!window.confirm('Annuler ce duel ? Les deux suggestions retourneront dans les feedbacks.'))
      return
    setCancelingId(pollId)
    const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' })
    setCancelingId(null)
    if (!res.ok) {
      toast.error("Impossible d'annuler ce duel.")
      return
    }
    setPolls((ps) => ps.filter((p) => p.id !== pollId))
    toast.success('Duel annulé · les suggestions sont de nouveau disponibles.')
    router.refresh()
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Votes</h1>
        <p className="text-sm text-muted-foreground">
          {active.length} duel{active.length > 1 ? 's' : ''} en cours
        </p>
      </div>

      {active.length === 0 && scheduled.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <Vote className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun duel en cours pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.map((poll) => (
            <DuelCard
              key={poll.id}
              poll={poll}
              onVote={vote}
              canManage={canManage}
              onCancel={() => cancelPoll(poll.id)}
              canceling={cancelingId === poll.id}
            />
          ))}
          {scheduled.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {scheduled.map((poll) => (
                <ScheduledDuelCard
                  key={poll.id}
                  poll={poll}
                  canManage={canManage}
                  onCancel={() => cancelPoll(poll.id)}
                  canceling={cancelingId === poll.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {expired.length > 0 && (
        <div className="space-y-3 border-t border-border pt-6">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Duels passés
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {expired.map((poll) => (
              <PastDuelRow key={poll.id} poll={poll} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DuelCard({
  poll,
  onVote,
  canManage,
  onCancel,
  canceling,
}: {
  poll: PollItem
  onVote: (pollId: string, optionId: string) => void
  canManage: boolean
  onCancel: () => void
  canceling: boolean
}) {
  const [a, b] = poll.options
  const hasResults = a.votes !== null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 size-64 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -bottom-24 size-64 rounded-full bg-rose-500/10 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Duel en direct
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <Clock className="size-3" />
            {timeLeft(poll.expiresAt)}
          </span>
          {canManage && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onCancel}
              disabled={canceling}
              aria-label="Annuler ce duel"
            >
              {canceling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex flex-col items-stretch gap-3 p-5 sm:flex-row sm:gap-0">
        <DuelCorner
          corner="blue"
          option={a}
          selected={poll.myVote === a.id}
          pct={hasResults ? pct(a.votes, poll.totalVotes) : null}
          onClick={() => onVote(poll.id, a.id)}
        />

        <div className="relative z-10 flex shrink-0 items-center justify-center py-2 sm:-mx-6 sm:py-0">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-foreground to-foreground/70 text-sm font-black text-background shadow-xl"
          >
            VS
          </motion.span>
        </div>

        <DuelCorner
          corner="rose"
          option={b}
          selected={poll.myVote === b.id}
          pct={hasResults ? pct(b.votes, poll.totalVotes) : null}
          onClick={() => onVote(poll.id, b.id)}
        />
      </div>

      {poll.myVote && (
        <p className="relative flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-primary" />
          Vote enregistré · {poll.totalVotes} vote{poll.totalVotes > 1 ? 's' : ''} au total
        </p>
      )}
    </div>
  )
}

function pct(votes: number | null, total: number): number {
  if (!votes || total <= 0) return 0
  return Math.round((votes / total) * 100)
}

const CORNER_STYLES = {
  blue: {
    idle: 'border-border hover:border-sky-500/50 hover:bg-sky-500/5',
    selected: 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10',
    text: 'text-sky-500',
    glow: 'from-sky-500/15',
    bar: 'bg-sky-500',
  },
  rose: {
    idle: 'border-border hover:border-rose-500/50 hover:bg-rose-500/5',
    selected: 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10',
    text: 'text-rose-500',
    glow: 'from-rose-500/15',
    bar: 'bg-rose-500',
  },
} as const

function DuelCorner({
  corner,
  option,
  selected,
  pct,
  onClick,
}: {
  corner: 'blue' | 'rose'
  option: PollOptionItem
  selected: boolean
  pct: number | null
  onClick: () => void
}) {
  const styles = CORNER_STYLES[corner]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 px-6 py-8 text-center transition-all duration-200 sm:min-h-40',
        selected ? styles.selected : styles.idle
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity group-hover:opacity-100',
          styles.glow,
          selected && 'opacity-100'
        )}
      />
      {pct !== null && (
        <span className="relative z-10 h-9">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={pct}
              initial={{ scale: 0.6, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={cn('inline-block text-3xl font-black tabular-nums', styles.text)}
            >
              {pct}%
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      <span
        className={cn(
          'relative z-10 text-base font-bold text-balance sm:text-lg',
          selected ? styles.text : 'text-foreground'
        )}
      >
        {option.label}
      </span>
      {pct !== null && (
        <div className="relative z-10 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={cn('h-full rounded-full', styles.bar)}
          />
        </div>
      )}
      {selected && (
        <span
          className={cn(
            'absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm',
            corner === 'blue' ? 'from-sky-500 to-sky-600' : 'from-rose-500 to-rose-600'
          )}
        >
          <CheckCircle2 className="size-3.5" />
        </span>
      )}
    </button>
  )
}

function ScheduledDuelCard({
  poll,
  canManage,
  onCancel,
  canceling,
}: {
  poll: PollItem
  canManage: boolean
  onCancel: () => void
  canceling: boolean
}) {
  const [a, b] = poll.options
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 opacity-80">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          <Swords className="size-3.5" />À venir
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Timer className="size-3" />
            {timeUntilStart(poll.startsAt)}
          </span>
          {canManage && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onCancel}
              disabled={canceling}
              aria-label="Annuler ce duel"
            >
              {canceling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex-1 truncate text-sky-500">{a.label}</span>
        <span className="text-xs font-black text-muted-foreground">VS</span>
        <span className="flex-1 truncate text-right text-rose-500">{b.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Ouvre le {formatDate(poll.startsAt)} · ferme le {formatDate(poll.expiresAt)}
      </p>
    </div>
  )
}

function PastDuelRow({ poll }: { poll: PollItem }) {
  const [a, b] = poll.options
  const aVotes = a.votes ?? 0
  const bVotes = b.votes ?? 0
  const total = poll.totalVotes
  const aPct = total > 0 ? Math.round((aVotes / total) * 100) : 50
  const bPct = total > 0 ? 100 - aPct : 50
  const winner = total === 0 ? null : aVotes === bVotes ? 'tie' : aVotes > bVotes ? a.id : b.id

  return (
    <div className="flex flex-col gap-2.5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={cn(
            'flex flex-1 items-center gap-1 truncate',
            winner === a.id ? 'text-sky-500' : 'text-muted-foreground'
          )}
        >
          {winner === a.id && <Crown className="size-3.5 shrink-0" />}
          <span className="truncate">{a.label}</span>
        </span>
        {winner === 'tie' ? (
          <Minus className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <Trophy className="size-4 shrink-0 text-muted-foreground/50" />
        )}
        <span
          className={cn(
            'flex flex-1 items-center justify-end gap-1 truncate text-right',
            winner === b.id ? 'text-rose-500' : 'text-muted-foreground'
          )}
        >
          <span className="truncate">{b.label}</span>
          {winner === b.id && <Crown className="size-3.5 shrink-0" />}
        </span>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-sky-500" style={{ width: `${aPct}%` }} />
        <div className="bg-rose-500" style={{ width: `${bPct}%` }} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {aPct}% · {aVotes} vote{aVotes > 1 ? 's' : ''}
        </span>
        <span>{formatDate(poll.expiresAt)}</span>
        <span>
          {bPct}% · {bVotes} vote{bVotes > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
