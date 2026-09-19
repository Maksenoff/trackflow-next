'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Vote } from 'lucide-react'
import type { getPollsList } from '@/lib/polls-data'
import { CountUp } from '@/components/new-ui/count-up'

type Poll = Awaited<ReturnType<typeof getPollsList>>[number]

function timeLeft(expiresAt: Date): string {
  const diffMs = expiresAt.getTime() - Date.now()
  if (diffMs <= 0) return 'Terminé'
  const diffH = Math.round(diffMs / (60 * 60 * 1000))
  if (diffH < 24) return `${diffH}h restantes`
  return `${Math.round(diffH / 24)}j restants`
}

// Aperçu lecture seule du duel en cours — retour Maksen 2026-09-19 : voter
// depuis le tableau de bord n'est pas normal, seul /votes doit permettre de
// voter. Tout le bloc est un lien vers /votes plutôt que des boutons d'option
// cliquables un par un.
export function NewVoteWidget({ poll }: { poll: Poll | null }) {
  if (!poll) {
    return (
      <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2.5 py-8 text-center">
        <span
          className="flex size-11 items-center justify-center rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--nu-acc) 14%, transparent)',
            color: 'var(--nu-acc)',
          }}
        >
          <Vote className="size-5" />
        </span>
        <p className="text-xs" style={{ color: 'var(--nu-dim)' }}>
          Aucun duel en cours.
        </p>
      </div>
    )
  }

  const leaderId = poll.options.reduce(
    (leader, o) =>
      leader === null || o.votes > (poll.options.find((x) => x.id === leader)?.votes ?? -1)
        ? o.id
        : leader,
    null as string | null
  )
  const hasVotes = poll.totalVotes > 0

  return (
    <Link href="/votes" className="mt-3 flex flex-1 flex-col">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-semibold" style={{ color: 'var(--nu-dim)' }}>
          {timeLeft(poll.expiresAt)}
        </div>
        <div className="text-xs" style={{ color: 'var(--nu-dim)' }}>
          {poll.totalVotes} vote{poll.totalVotes > 1 ? 's' : ''}
        </div>
      </div>

      <div className="mt-2">
        {poll.options.map((option) => {
          const pct = hasVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0
          const isWinner = hasVotes && option.id === leaderId
          const isMine = poll.myVote === option.id
          const color = isWinner ? 'var(--nu-acc)' : 'var(--nu-dim)'
          return (
            <div key={option.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <b
                  className="truncate text-[14px] font-semibold"
                  style={{ color: isMine || isWinner ? color : 'var(--nu-txt)' }}
                >
                  {option.label}
                </b>
                <CountUp
                  value={pct}
                  suffix="%"
                  className="nu-num shrink-0 text-[15px] font-bold"
                  style={{ color }}
                />
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--nu-surf2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-1.5 text-[11px]" style={{ color: 'var(--nu-dim)' }}>
                {option.votes} vote{option.votes > 1 ? 's' : ''}
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="mt-auto flex items-center gap-2 border-t pt-3 text-[12px] font-semibold"
        style={{ borderColor: 'var(--nu-line)', color: 'var(--nu-acc)' }}
      >
        {poll.myVote ? 'Vote enregistré' : 'Aller voter'}
        <ArrowRight className="ml-auto size-3.5" />
      </div>
    </Link>
  )
}
