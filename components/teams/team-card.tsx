'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'

export type TeamCardData = {
  id: string
  name: string
  members: (AthleteAvatarData & { id: string })[]
}

export function TeamCard({ team, index = 0 }: { team: TeamCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/teams/${team.id}`}
        className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/30">
            <UsersRound className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{team.name}</div>
            <div className="text-xs text-muted-foreground">
              {team.members.length} athlète{team.members.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {team.members.length > 0 ? (
          <div className="mt-auto flex -space-x-2.5">
            {team.members.slice(0, 6).map((m) => (
              <AthleteAvatar key={m.id} athlete={m} className="size-9" />
            ))}
            {team.members.length > 6 && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground ring-2 ring-card">
                +{team.members.length - 6}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground">Aucun athlète pour le moment.</p>
        )}
      </Link>
    </motion.div>
  )
}
