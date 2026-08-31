'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Pencil, ExternalLink, BarChart3, Trophy, MoreHorizontal } from 'lucide-react'
import { calcAge, initials, GENDER_LABELS, formatFollowedSince } from '@/lib/athlete'
import { DISCIPLINE_LABELS, defaultDisciplineColor } from '@/lib/disciplines'
import { FfaSyncButtons } from '@/components/athletes/ffa-sync-buttons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CountUp } from '@/components/dashboard/count-up'
import { useIsLightTheme } from '@/lib/use-is-light-theme'
import type { AthleteDetail } from '@/lib/athletes-data'

// Bannière toujours sombre, dans les deux thèmes, quand il n'y a pas de photo —
// identité de marque, comme le bandeau dashboard (voir DashboardHeader).
const BANNER_FROM = '#1a0a2e'
const BANNER_TO = '#2d1060'

// Boutons overlay sur la bannière : fond sombre opaque + bordure, pas du verre
// dépoli blanc/10 — se lisent quelle que soit la photo (correctif 2026-08-22).
// Un peu plus clair en light qu'en dark (dark:bg-black/55) — trop sombre par
// défaut détonnait avec le reste du thème clair (correctif 2026-08-22ter).
const OVERLAY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:px-3 dark:bg-black/55 dark:hover:bg-black/70'

export function ProfileHeader({
  athlete,
  canEdit,
  canEditProfile,
  isAdmin,
}: {
  athlete: AthleteDetail
  canEdit: boolean
  canEditProfile: boolean
  isAdmin: boolean
}) {
  const isLight = useIsLightTheme()
  const age = calcAge(athlete.birthDate)
  const goalsAchieved = athlete.goals.filter((g) => g.status === 'achieved').length
  const goalsInProgress = athlete.goals.filter((g) => g.status === 'in_progress').length

  const isBannerPhoto = athlete.bannerConfig.mode === 'photo' && athlete.bannerUrl
  const hasFfa = canEdit && !!athlete.ffaProfileUrl
  const hasPerformances = athlete.performances.length > 0

  return (
    <div className="overflow-hidden rounded-3xl border border-border">
      {/* Zone 1 — bannière : PHOTO/dégradé + boutons action uniquement. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-[130px] overflow-hidden sm:h-[200px]"
      >
        {isBannerPhoto ? (
          <Image
            src={athlete.bannerUrl!}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover"
            style={{
              objectPosition: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${BANNER_FROM}, ${BANNER_TO})` }}
          />
        )}

        {/* Actions — mêmes boutons sur mobile et desktop, juste le libellé qui
            se cache en dessous de sm (icône seule sur mobile, plutôt que de
            les planquer dans un bottom sheet — correctif 2026-08-22ter).
            Stats avancées/Podiums/Modifier restent des pills à accès direct ;
            seule la sync FFA (annexe, peu utilisée) va dans le menu "···". */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 sm:top-4 sm:right-4">
          {hasPerformances && (
            <Link href={`/athletes/${athlete.id}/stats`} className={OVERLAY_BUTTON_CLASS}>
              <BarChart3 className="size-3.5" />
              <span className="hidden sm:inline">Stats avancées</span>
            </Link>
          )}
          <Link href={`/athletes/${athlete.id}/podiums`} className={OVERLAY_BUTTON_CLASS}>
            <Trophy className="size-3.5" />
            <span className="hidden sm:inline">Podiums</span>
          </Link>
          {canEditProfile && (
            <Link href={`/athletes/${athlete.id}/edit`} className={OVERLAY_BUTTON_CLASS}>
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Modifier</span>
            </Link>
          )}
          {hasFfa && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Sync FFA"
                    className={`${OVERLAY_BUTTON_CLASS} px-2`}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-48">
                <FfaSyncButtons athleteId={athlete.id} showFullResync={isAdmin} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>

      {/* Zone 2 — infos athlète sous la bannière, empilées et séparées par des
          traits pleine largeur plutôt qu'un fond dégradé ou une répartition
          gauche/droite — c'est ce qui donne l'impression d'occuper toute la
          largeur de la card (correctif 2026-08-22, d'après capture de réf.). */}
      <div className="bg-card px-4 sm:px-8">
        <div className="flex items-end gap-3 py-4 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="-mt-8 shrink-0 sm:-mt-10"
          >
            {athlete.photoUrl ? (
              <div
                className="size-16 overflow-hidden rounded-full border-2 border-white sm:size-20"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={athlete.photoUrl}
                  alt=""
                  className="size-full object-cover"
                  style={{
                    objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                    transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                    transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                  }}
                />
              </div>
            ) : (
              <div
                className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-primary text-xl font-bold text-white sm:size-20 sm:text-2xl"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
              >
                {initials(athlete.firstName, athlete.lastName)}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="min-w-0 flex-1 space-y-1.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
                {athlete.firstName} {athlete.lastName}
              </h1>
              {athlete.licenseNumber && (
                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  #{athlete.licenseNumber}
                </span>
              )}
            </div>

            {athlete.disciplines.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {athlete.disciplines.map((d, i) => {
                  const color = athlete.disciplineColors[d] ?? defaultDisciplineColor(i)
                  return (
                    <span
                      key={d}
                      className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${color} ${isLight ? 55 : 30}%, transparent), color-mix(in srgb, ${color} ${isLight ? 26 : 12}%, transparent))`,
                        color,
                        borderColor: `color-mix(in srgb, ${color} ${isLight ? 65 : 45}%, transparent)`,
                      }}
                    >
                      {DISCIPLINE_LABELS[d] ?? d}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              {age !== null && <span>{age} ans</span>}
              {athlete.gender && <span>{GENDER_LABELS[athlete.gender] ?? athlete.gender}</span>}
              <span>Suivi depuis {formatFollowedSince(athlete.createdAt)}</span>
            </div>
          </motion.div>
        </div>

        {athlete.ffaProfileUrl && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-border py-3 text-xs text-muted-foreground">
            <a
              href={athlete.ffaProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Profil FFA
              <ExternalLink className="size-3" />
            </a>
            {athlete.lastSyncedAt && <span>· {formatSyncDateTime(athlete.lastSyncedAt)}</span>}
          </div>
        )}
      </div>

      {/* Zone 3 — bandeau 4 stats : pas d'icônes, chiffres colorés selon le
          sens (blanc/principal pour les compteurs neutres, vert pour les
          objectifs atteints, bleu-violet pour ceux en cours). */}
      <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-card shadow-sm sm:grid-cols-4 dark:shadow-none">
        <StatTile
          label="Séances"
          value={athlete.athleteSessions.filter((s) => !s.skipped).length}
        />
        <StatTile label="Performances" value={athlete.performances.length} />
        <StatTile label="Objectifs atteints" value={goalsAchieved} color="#22c55e" />
        <StatTile label="Objectifs en cours" value={goalsInProgress} color="#818cf8" />
      </div>
    </div>
  )
}

function formatSyncDateTime(date: Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-4 text-center">
      <div
        className="text-2xl font-bold sm:text-3xl"
        style={{ color: color ?? 'var(--foreground)' }}
      >
        <CountUp value={value} />
      </div>
      <div
        className="text-[11px] text-muted-foreground uppercase"
        style={{ letterSpacing: '0.05em' }}
      >
        {label}
      </div>
    </div>
  )
}
