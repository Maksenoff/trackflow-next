'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UsersRound, Zap } from 'lucide-react'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { DisciplinePictogram } from '@/components/athletes/discipline-pictogram'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'

export type TeamCardData = {
  id: string
  name: string
  discipline: string | null
  color: string | null
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
  members: (AthleteAvatarData & { id: string; relayOrder: number | null })[]
}

const OVERLAY_PILL_CLASS =
  'inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm'

/**
 * Card "poster" — la couleur de l'équipe est TOUJOURS le fond de la card
 * (correctif 2026-08-25 ter : "ya toujours une partie de la card dans une
 * couleur fixe ... et apres ya la photo quelque part dedans" — la photo
 * n'est plus le fond, c'est un cadre inséré par-dessus, légèrement incliné,
 * façon photo de vestiaire punaisée). Sans photo, le pictogramme discipline
 * sert de texture en filigrane sur le fond couleur. Pastille discipline en
 * fond plein (couleur d'équipe) pour ne jamais se fondre dans la photo.
 */
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
        className="group relative flex h-64 flex-col overflow-hidden rounded-3xl border border-border shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
        style={{
          background: `linear-gradient(150deg, ${accent}, color-mix(in srgb, ${accent} 45%, black))`,
        }}
      >
        {/* Fond couleur fixe — toujours visible, photo ou pas. Le pictogramme reste
            affiché même avec une photo (juste plus discret) : la photo n'occupe que
            54% de la largeur en haut-droite, donc le pictogramme se cale sur la
            colonne libre à gauche plutôt que de disparaître ou de se superposer à
            la photo. Sans photo, centré au milieu de la card. Dimensionné en
            largeur (w-auto h-auto) et non en hauteur : le viewBox "sprint"
            (starting-blocks) est très large (160×60) — le caler sur la hauteur de
            la card le faisait déborder démesurément en largeur. */}
        {team.discipline &&
          (team.photoUrl ? (
            <DisciplinePictogram
              discipline={team.discipline}
              className="absolute top-1/2 left-3 w-[40%] -translate-y-1/2 text-white opacity-10 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <DisciplinePictogram
              discipline={team.discipline}
              className="absolute top-1/2 left-1/2 w-[65%] -translate-x-1/2 -translate-y-1/2 text-white opacity-25 transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ))}
        {!team.discipline && !team.photoUrl && (
          <UsersRound className="absolute right-5 bottom-5 size-12 text-white/20" />
        )}

        {/* Photo — cadre inséré par-dessus le fond couleur, pas le fond lui-même. */}
        {team.photoUrl && (
          <div className="absolute top-4 right-4 h-[68%] w-[54%] rotate-2 overflow-hidden rounded-2xl border-2 border-white/25 shadow-lg transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.photoUrl}
              alt=""
              className="size-full object-cover"
              style={{
                objectPosition: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                transform: `scale(${team.photoConfig.zoom ?? 1})`,
                transformOrigin: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
              }}
            />
          </div>
        )}

        {/* Scrim bas : garantit la lisibilité du texte quelle que soit la couleur. */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative z-10 flex items-start justify-between gap-2 p-3">
          {team.discipline ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              <Zap className="size-3" />
              {DISCIPLINE_LABELS[team.discipline] ?? team.discipline}
            </span>
          ) : (
            <span />
          )}
          {positioned.length > 0 && positioned.length < 4 && (
            <span className={OVERLAY_PILL_CLASS}>{positioned.length}/4</span>
          )}
        </div>

        <div className="relative z-10 mt-auto flex flex-col gap-2.5 p-3">
          <div className="truncate text-lg font-extrabold text-white">{team.name}</div>

          {positioned.length > 0 && (
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${(Math.min(positioned.length, 4) / 4) * 100}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {team.members.length > 0 ? (
              <div className="flex -space-x-2.5">
                {team.members.slice(0, 5).map((m) => (
                  <div key={m.id} className="relative">
                    <AthleteAvatar athlete={m} className="size-8 ring-2 ring-black/40" />
                    {m.relayOrder != null && (
                      <span
                        className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-black/40"
                        style={{ backgroundColor: accent }}
                      >
                        {m.relayOrder}
                      </span>
                    )}
                  </div>
                ))}
                {team.members.length > 5 && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-2 ring-black/40 backdrop-blur-sm">
                    +{team.members.length - 5}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs font-medium text-white/70">Aucun athlète</span>
            )}
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-white/80">
              <UsersRound className="size-3.5" />
              {team.members.length}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
