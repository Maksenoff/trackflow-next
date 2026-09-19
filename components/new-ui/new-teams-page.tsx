'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { DisciplinePictogram } from '@/components/athletes/discipline-pictogram'
import type { TeamCardData } from '@/components/teams/team-card'

function TeamPoster({ team, index }: { team: TeamCardData; index: number }) {
  const tone = team.color ?? 'var(--nu-acc)'
  const positioned = team.members.filter((m) => m.relayOrder != null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.9, 0.25, 1], delay: Math.min(index, 12) * 0.07 }}
    >
      <Link
        href={`/teams/${team.id}`}
        className="nu-team-poster group relative flex overflow-hidden rounded-[20px]"
        style={{ background: 'var(--nu-surf)' }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative h-[158px] overflow-hidden"
            style={{ background: 'var(--nu-surf2)' }}
          >
            {team.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.photoUrl}
                alt=""
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                style={{
                  objectPosition: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                  transform: `scale(${team.photoConfig.zoom ?? 1})`,
                }}
              />
            ) : (
              team.discipline && (
                <DisciplinePictogram
                  discipline={team.discipline}
                  className="absolute top-1/2 left-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 opacity-30"
                  style={{ color: tone }}
                />
              )
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                color: tone,
                opacity: 0.3,
                background:
                  'linear-gradient(180deg, rgba(9,11,15,.15) 30%, rgba(9,11,15,.92)), linear-gradient(200deg, currentColor, transparent 62%)',
              }}
            />

            <div className="absolute inset-x-3.5 top-3 flex items-center justify-between gap-2.5">
              {team.discipline ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-[8px]">
                  <i className="size-[7px] shrink-0 rounded-full" style={{ background: tone }} />
                  {DISCIPLINE_LABELS[team.discipline] ?? team.discipline}
                </span>
              ) : (
                <span />
              )}
              {positioned.length > 0 && positioned.length < 4 && (
                <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-white backdrop-blur-[8px]">
                  {positioned.length}/4
                </span>
              )}
            </div>

            <h3 className="absolute bottom-4 left-4.5 z-[2] max-w-[calc(100%-36px)] truncate text-[24px] font-extrabold tracking-[-0.03em] text-white">
              {team.name}
            </h3>
          </div>

          <div className="h-[3px]" style={{ background: 'var(--nu-surf2)' }}>
            <div
              className="h-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${Math.round((Math.min(positioned.length, 4) / 4) * 100)}%`,
                background: tone,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3.5 px-4.5 py-3.5">
            <div className="flex">
              {team.members.slice(0, 5).map((m, i) => (
                <div
                  key={m.id}
                  className="relative flex size-[34px] items-center justify-center overflow-hidden rounded-[11px] text-[11px] font-bold"
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    border: '2px solid var(--nu-surf)',
                    background: 'var(--nu-surf2)',
                    color: 'var(--nu-dim)',
                  }}
                >
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photoUrl}
                      alt=""
                      className="size-full object-cover"
                      style={{
                        objectPosition: `${m.photoConfig.x ?? 50}% ${m.photoConfig.y ?? 50}%`,
                        transform: `scale(${m.photoConfig.zoom ?? 1})`,
                      }}
                    />
                  ) : (
                    `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase()
                  )}
                  {m.relayOrder != null && (
                    <span
                      className="absolute -top-1 -left-1 flex size-[15px] items-center justify-center rounded-full text-[8.5px] font-black"
                      style={{ background: tone, color: '#04121f' }}
                    >
                      {m.relayOrder}
                    </span>
                  )}
                </div>
              ))}
              {team.members.length === 0 && (
                <span className="text-xs font-medium" style={{ color: 'var(--nu-dim)' }}>
                  Aucun athlète
                </span>
              )}
            </div>
            {team.members.length > 0 && (
              <span
                className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px]"
                style={{ color: 'var(--nu-dim)' }}
              >
                <UsersRound className="size-3.5" />
                {team.members.length}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function NewTeamsPage({ teams, canCreate }: { teams: TeamCardData[]; canCreate: boolean }) {
  return (
    <div>
      {/* Masqué sur mobile : redondant avec la nav (déjà sur "Équipes"), même
          traitement que le reste de l'app classique (retour Maksen
          2026-09-18). */}
      <div className="hidden sm:mb-[26px] sm:block">
        <h1 className="nu-it text-[40px]" style={{ color: 'var(--nu-txt)' }}>
          Équipes
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--nu-dim)' }}>
          {teams.length} équipe{teams.length > 1 ? 's' : ''} engagée{teams.length > 1 ? 's' : ''}{' '}
          cette saison
        </p>
      </div>

      {teams.length === 0 && !canCreate ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-20 text-center"
          style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
        >
          <UsersRound className="size-8" style={{ color: 'var(--nu-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
            Aucune équipe pour le moment.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}
        >
          {teams.map((team, i) => (
            <TeamPoster key={team.id} team={team} index={i} />
          ))}
          {canCreate && (
            <Link
              href="/teams/new"
              className="nu-add-tile grid min-h-[223px] place-items-center rounded-[20px] text-[13.5px] font-semibold"
            >
              + Créer une équipe
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
