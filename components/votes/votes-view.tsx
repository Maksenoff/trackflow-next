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
  Pencil,
  Pin,
  PinOff,
  Swords,
  Timer,
  Trash2,
  Trophy,
  Vote,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AddButton } from '@/components/ui/add-button'
import { PollFormDialog, type PollFormInitial } from '@/components/votes/poll-form-dialog'
import { VoteBreakdownDialog } from '@/components/votes/vote-breakdown-dialog'
import { cn } from '@/lib/utils'
import type { PollStatus } from '@/lib/polls-data'

export type PollOptionItem = {
  id: string
  label: string
  votes: number
}

type TabKey = 'current' | 'upcoming' | 'past'

export type PollItem = {
  id: string
  createdAt: string
  createdById: string | null
  startsAt: string
  expiresAt: string
  pinnedOrder: number | null
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

function toFormInitial(poll: PollItem): PollFormInitial {
  const [a, b] = poll.options
  return {
    id: poll.id,
    startsAt: poll.startsAt,
    expiresAt: poll.expiresAt,
    options: [
      { id: a.id, label: a.label },
      { id: b.id, label: b.label },
    ],
  }
}

export function VotesView({
  polls: initial,
  canManage,
  currentUserId,
}: {
  polls: PollItem[]
  canManage: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [polls, setPolls] = useState(initial)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('current')
  const [direction, setDirection] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingPoll, setEditingPoll] = useState<PollItem | null>(null)
  const [breakdownPollId, setBreakdownPollId] = useState<string | null>(null)

  const canEditPoll = (poll: PollItem) => canManage || poll.createdById === currentUserId

  const scheduled = polls.filter((p) => p.status === 'scheduled')
  const active = polls.filter((p) => p.status === 'active')
  const expired = polls.filter((p) => p.status === 'expired')
  // Le "dernier vote" est celui dont le duel s'est terminé le plus récemment (expiresAt),
  // pas forcément le plus récent en création — un duel programmé après un autre peut très
  // bien se terminer avant lui.
  const lastCompleted = expired.reduce<PollItem | null>(
    (latest, p) =>
      !latest || new Date(p.expiresAt).getTime() > new Date(latest.expiresAt).getTime()
        ? p
        : latest,
    null
  )

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
    setCancelingId(pollId)
    const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' })
    setCancelingId(null)
    if (!res.ok) {
      toast.error("Impossible d'annuler ce vote.")
      return
    }
    setPolls((ps) => ps.filter((p) => p.id !== pollId))
    toast.success('Vote annulé.')
    router.refresh()
  }

  async function togglePin(poll: PollItem) {
    setPinningId(poll.id)
    const isPinned = poll.pinnedOrder !== null
    const res = await fetch(`/api/polls/${poll.id}/pin`, {
      method: isPinned ? 'DELETE' : 'POST',
    })
    setPinningId(null)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error ?? "Impossible de modifier l'épinglage.")
      return
    }
    // Mise à jour optimiste + re-tri immédiat (épinglés d'abord) : sans ça
    // l'épingle/dépingle ne se reflétait qu'après un rechargement complet de
    // la page, router.refresh() seul ne suffisant pas à faire remonter le
    // vote visuellement tout de suite (correctif 2026-08-29).
    const data: { pinnedOrder?: number } | null = isPinned
      ? null
      : await res.json().catch(() => null)
    setPolls((ps) =>
      ps
        .map((p) =>
          p.id === poll.id
            ? { ...p, pinnedOrder: isPinned ? null : (data?.pinnedOrder ?? null) }
            : p
        )
        .sort((a, b) => {
          const aOrder = a.pinnedOrder ?? Infinity
          const bOrder = b.pinnedOrder ?? Infinity
          if (aOrder !== bOrder) return aOrder - bOrder
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    )
    router.refresh()
  }

  const tabs: { key: TabKey; label: string; icon: typeof Vote; count: number }[] = [
    { key: 'current', label: 'En cours', icon: Vote, count: active.length },
    { key: 'upcoming', label: 'À venir', icon: Timer, count: scheduled.length },
    { key: 'past', label: 'Passés', icon: Trophy, count: expired.length },
  ]

  function switchTo(key: TabKey) {
    if (key === tab) return
    const from = tabs.findIndex((t) => t.key === tab)
    const to = tabs.findIndex((t) => t.key === key)
    setDirection(to > from ? 1 : -1)
    setTab(key)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Votes</h1>
          <p className="text-sm text-muted-foreground">
            {active.length} duel{active.length > 1 ? 's' : ''} en cours
          </p>
        </div>
        <AddButton label="Créer un vote" onClick={() => setCreateOpen(true)} />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
        {tabs.map((t) => {
          const isActive = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTo(t.key)}
              className={cn(
                'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="votes-tab-active"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              )}
              <t.icon className="size-3.5" />
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-bold',
                  isActive ? 'bg-white/20' : 'bg-muted'
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={tab}
            custom={direction}
            initial={{ x: direction * 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {tab === 'current' &&
              (active.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                  <Vote className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun duel en cours pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {active.map((poll) => (
                    <DuelCard
                      key={poll.id}
                      poll={poll}
                      onVote={vote}
                      canManage={canManage}
                      canEdit={canEditPoll(poll)}
                      onCancel={() => cancelPoll(poll.id)}
                      canceling={cancelingId === poll.id}
                      onEdit={() => setEditingPoll(poll)}
                      onTogglePin={() => togglePin(poll)}
                      pinning={pinningId === poll.id}
                      onShowBreakdown={() => setBreakdownPollId(poll.id)}
                    />
                  ))}
                </div>
              ))}

            {tab === 'upcoming' &&
              (scheduled.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                  <Swords className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucun duel programmé.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {scheduled.map((poll) => (
                    <ScheduledDuelCard
                      key={poll.id}
                      poll={poll}
                      canEdit={canEditPoll(poll)}
                      onCancel={() => cancelPoll(poll.id)}
                      canceling={cancelingId === poll.id}
                      onEdit={() => setEditingPoll(poll)}
                    />
                  ))}
                </div>
              ))}

            {tab === 'past' &&
              (expired.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                  <Trophy className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun duel terminé pour le moment.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {expired.map((poll) => (
                    <PastDuelRow
                      key={poll.id}
                      poll={poll}
                      canEdit={canEditPoll(poll)}
                      onEdit={() => setEditingPoll(poll)}
                      onShowBreakdown={() => setBreakdownPollId(poll.id)}
                    />
                  ))}
                </div>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {tab === 'current' && lastCompleted && (
        <div className="border-t border-border pt-6">
          <LastVoteRecap
            poll={lastCompleted}
            onShowBreakdown={() => setBreakdownPollId(lastCompleted.id)}
          />
        </div>
      )}

      <PollFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <PollFormDialog
        open={!!editingPoll}
        onOpenChange={(open) => !open && setEditingPoll(null)}
        initial={editingPoll ? toFormInitial(editingPoll) : undefined}
      />
      <VoteBreakdownDialog
        open={!!breakdownPollId}
        onOpenChange={(open) => !open && setBreakdownPollId(null)}
        pollId={breakdownPollId}
      />
    </div>
  )
}

function DuelCard({
  poll,
  onVote,
  canManage,
  canEdit,
  onCancel,
  canceling,
  onEdit,
  onTogglePin,
  pinning,
  onShowBreakdown,
}: {
  poll: PollItem
  onVote: (pollId: string, optionId: string) => void
  canManage: boolean
  canEdit: boolean
  onCancel: () => void
  canceling: boolean
  onEdit: () => void
  onTogglePin: () => void
  pinning: boolean
  onShowBreakdown: () => void
}) {
  const [a, b] = poll.options
  const isPinned = poll.pinnedOrder !== null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-card shadow-lg shadow-black/[0.06] dark:shadow-black/30',
        isPinned ? 'border-amber-500/40' : 'border-border'
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 size-64 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -bottom-24 size-64 rounded-full bg-rose-500/10 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Duel en direct
          {isPinned && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 normal-case dark:text-amber-400">
              <Pin className="size-2.5" />
              Épinglé
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <Clock className="size-3" />
            {timeLeft(poll.expiresAt)}
          </span>
          {canManage && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onTogglePin}
              disabled={pinning}
              aria-label={isPinned ? 'Désépingler' : 'Épingler'}
              title={isPinned ? 'Désépingler' : 'Épingler'}
            >
              {pinning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPinned ? (
                <PinOff className="size-4 text-amber-500" />
              ) : (
                <Pin className="size-4" />
              )}
            </Button>
          )}
          {canEdit && (
            <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Modifier ce vote">
              <Pencil className="size-4" />
            </Button>
          )}
          {canEdit && (
            <CancelPollButton
              onCancel={onCancel}
              canceling={canceling}
              size="icon-sm"
              iconSize="size-4"
            />
          )}
        </div>
      </div>

      <div className="relative flex flex-col items-stretch gap-3 p-5 sm:flex-row sm:gap-0">
        <DuelCorner
          corner="blue"
          option={a}
          selected={poll.myVote === a.id}
          pct={pct(a.votes, poll.totalVotes)}
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
          pct={pct(b.votes, poll.totalVotes)}
          onClick={() => onVote(poll.id, b.id)}
        />
      </div>

      {poll.myVote && (
        <button
          type="button"
          onClick={onShowBreakdown}
          className="relative flex w-full items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-xs text-muted-foreground transition-colors hover:bg-primary/[0.03] hover:text-primary"
        >
          <CheckCircle2 className="size-3.5 text-primary" />
          Vote enregistré · {poll.totalVotes} vote{poll.totalVotes > 1 ? 's' : ''} au total
        </button>
      )}
    </div>
  )
}

function CancelPollButton({
  onCancel,
  canceling,
  size,
  iconSize,
}: {
  onCancel: () => void
  canceling: boolean
  size: 'icon-sm' | 'icon-xs'
  iconSize: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button size={size} variant="ghost" disabled={canceling} aria-label="Annuler ce vote">
            {canceling ? (
              <Loader2 className={cn(iconSize, 'animate-spin')} />
            ) : (
              <Trash2 className={cn(iconSize, 'text-destructive')} />
            )}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler ce vote ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les votes déjà enregistrés seront définitivement perdus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Retour</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCancel}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Annuler le vote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function pct(votes: number, total: number): number {
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
  pct: number
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
      <span
        className={cn(
          'relative z-10 text-base font-bold text-balance sm:text-lg',
          selected ? styles.text : 'text-foreground'
        )}
      >
        {option.label}
      </span>
      <div className="relative z-10 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn('h-full rounded-full', styles.bar)}
        />
      </div>
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
  canEdit,
  onCancel,
  canceling,
  onEdit,
}: {
  poll: PollItem
  canEdit: boolean
  onCancel: () => void
  canceling: boolean
  onEdit: () => void
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
          {canEdit && (
            <Button size="icon-xs" variant="ghost" onClick={onEdit} aria-label="Modifier ce vote">
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canEdit && (
            <CancelPollButton
              onCancel={onCancel}
              canceling={canceling}
              size="icon-xs"
              iconSize="size-3.5"
            />
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

function PastDuelRow({
  poll,
  canEdit,
  onEdit,
  onShowBreakdown,
}: {
  poll: PollItem
  canEdit: boolean
  onEdit: () => void
  onShowBreakdown: () => void
}) {
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
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onShowBreakdown}
            className="underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
          >
            {formatDate(poll.expiresAt)}
          </button>
          {canEdit && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onEdit}
              aria-label="Prolonger ou modifier ce vote"
              title="Prolonger ou modifier ce vote"
            >
              <Pencil className="size-3" />
            </Button>
          )}
        </span>
        <span>
          {bPct}% · {bVotes} vote{bVotes > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

/** Recap mis en avant du dernier duel terminé (celui dont expiresAt est le plus récent). */
function LastVoteRecap({ poll, onShowBreakdown }: { poll: PollItem; onShowBreakdown: () => void }) {
  const [a, b] = poll.options
  const aVotes = a.votes ?? 0
  const bVotes = b.votes ?? 0
  const total = poll.totalVotes
  const aPct = total > 0 ? Math.round((aVotes / total) * 100) : 50
  const bPct = total > 0 ? 100 - aPct : 50
  const winner = total === 0 ? null : aVotes === bVotes ? 'tie' : aVotes > bVotes ? a.id : b.id

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] via-card to-card p-5 shadow-sm sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-amber-500/10 blur-3xl"
      />
      <div className="relative mb-4 flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-600 uppercase dark:text-amber-400">
        <Trophy className="size-3.5" />
        Dernier vote
      </div>

      <div className="relative grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <RecapSide label={a.label} pct={aPct} votes={aVotes} won={winner === a.id} color="blue" />

        <div className="flex items-center justify-center">
          {winner === 'tie' ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Minus className="size-4" />
            </span>
          ) : (
            <span className="text-xs font-black text-muted-foreground/60">VS</span>
          )}
        </div>

        <RecapSide
          label={b.label}
          pct={bPct}
          votes={bVotes}
          won={winner === b.id}
          color="rose"
          align="right"
        />
      </div>

      <button
        type="button"
        onClick={onShowBreakdown}
        className="relative mt-4 w-full border-t border-border pt-3 text-center text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        Terminé le {formatDate(poll.expiresAt)} · {total} vote{total > 1 ? 's' : ''} au total
      </button>
    </div>
  )
}

function RecapSide({
  label,
  pct,
  votes,
  won,
  color,
  align = 'left',
}: {
  label: string
  pct: number
  votes: number
  won: boolean
  color: 'blue' | 'rose'
  align?: 'left' | 'right'
}) {
  const styles = CORNER_STYLES[color]
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'right' && 'flex-row-reverse justify-end'
        )}
      >
        {won && <Crown className={cn('size-4 shrink-0', styles.text)} />}
        <span
          className={cn(
            'truncate text-base font-bold',
            won ? styles.text : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          'mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted',
          align === 'right' && 'ml-auto'
        )}
      >
        <div className={cn('h-full rounded-full', styles.bar)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {pct}% · {votes} vote{votes > 1 ? 's' : ''}
      </p>
    </div>
  )
}
