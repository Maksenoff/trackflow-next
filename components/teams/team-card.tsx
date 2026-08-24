'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'

export type TeamCardData = {
  id: string
  name: string
  color: string | null
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
  members: (AthleteAvatarData & { id: string; relayOrder: number | null })[]
}

export function TeamCard({ team, index = 0 }: { team: TeamCardData; index?: number }) {
  const accent = team.color ?? 'var(--primary)'
  const positioned = team.members.filter((m) => m.relayOrder != null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/teams/${team.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-l-[3px] border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ borderLeftColor: accent }}
      >
        <div className="relative aspect-[3/1] w-full shrink-0 overflow-hidden bg-muted">
          {team.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.photoUrl}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              style={{
                objectPosition: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                transform: `scale(${team.photoConfig.zoom ?? 1})`,
                transformOrigin: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
              }}
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, black))`,
              }}
            >
              <UsersRound className="size-7 text-white/80" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{team.name}</div>
            <div className="text-xs text-muted-foreground">
              {team.members.length} athlète{team.members.length > 1 ? 's' : ''}
            </div>
          </div>

          {team.members.length > 0 ? (
            <div className="mt-auto flex -space-x-2.5">
              {team.members.slice(0, 6).map((m) => (
                <div key={m.id} className="relative">
                  <AthleteAvatar athlete={m} className="size-9" />
                  {m.relayOrder != null && (
                    <span
                      className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-card"
                      style={{ backgroundColor: accent }}
                    >
                      {m.relayOrder}
                    </span>
                  )}
                </div>
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

          {positioned.length > 0 && positioned.length < 4 && (
            <p className="text-[11px] font-medium text-muted-foreground">
              {positioned.length}/4 positions pourvues
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
