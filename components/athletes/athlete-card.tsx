'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CalendarDays, TrendingUp, Target } from 'lucide-react'
import { calcAge, initials, GENDER_LABELS } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'

export type AthleteCardData = {
  id: string
  firstName: string
  lastName: string
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
  bannerUrl: string | null
  bannerConfig: {
    mode?: 'pattern' | 'photo'
    pattern?: string
    color?: string
    zoom?: number
    x?: number
    y?: number
  }
  birthDate: Date | null
  gender: string | null
  disciplines: string[]
  disciplineColors: Record<string, string>
  sessionsCount: number
  performancesCount: number
  goalsCount: number
}

// Bannière par défaut quand l'athlète n'a ni photo ni couleur personnalisée —
// même identité violette que le reste de l'app plutôt qu'un gris neutre.
const DEFAULT_BANNER_FROM = '#1a0a2e'
const DEFAULT_BANNER_TO = '#2d1060'

// Avatar : bordure blanche + ombre portée plutôt qu'une bordure violette —
// se fondait trop dans la bannière et les pills du même ton.
const AVATAR_SHADOW = '0 2px 12px rgba(0,0,0,0.5)'

// next/image ne sait pas gérer les data: URI (anciennes photos en base64,
// avant le passage à l'upload direct Vercel Blob) — on retombe sur une <img>
// classique dans ce seul cas, next/image partout ailleurs (URLs distantes réelles).
function isOptimizableUrl(url: string | null): url is string {
  return !!url && url.startsWith('http')
}

function AthleteCardImpl({ athlete, index = 0 }: { athlete: AthleteCardData; index?: number }) {
  const age = calcAge(athlete.birthDate)
  const bannerColor = athlete.bannerConfig.color
  const isPhotoBanner = athlete.bannerConfig.mode === 'photo' && athlete.bannerUrl
  const bannerOptimizable = isOptimizableUrl(athlete.bannerUrl)

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/athletes/${athlete.id}`}
        className="group relative flex h-full touch-manipulation flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(91,33,182,0.06)] transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12),0_10px_32px_rgba(91,33,182,0.14)] dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.35),0_10px_32px_rgba(91,33,182,0.18)]"
      >
        <div className="relative z-0 h-[100px] shrink-0 overflow-hidden sm:h-24">
          {isPhotoBanner && athlete.bannerUrl ? (
            bannerOptimizable ? (
              <Image
                src={athlete.bannerUrl}
                alt=""
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="scale-100 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                style={{
                  objectPosition: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={athlete.bannerUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full scale-100 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                style={{
                  objectPosition: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
                }}
              />
            )
          ) : (
            <div
              className="absolute inset-0 scale-100 overflow-hidden transition-transform duration-500 ease-out group-hover:scale-110"
              style={{
                background: bannerColor
                  ? `linear-gradient(135deg, ${bannerColor}, ${bannerColor}33)`
                  : `linear-gradient(135deg, ${DEFAULT_BANNER_FROM}, ${DEFAULT_BANNER_TO})`,
              }}
            >
              {!bannerColor && (
                <svg
                  aria-hidden
                  className="absolute inset-0 size-full opacity-[0.15]"
                  preserveAspectRatio="none"
                >
                  <pattern
                    id={`banner-pattern-${athlete.id}`}
                    width="18"
                    height="18"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="18" stroke="white" strokeWidth="1.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill={`url(#banner-pattern-${athlete.id})`} />
                </svg>
              )}
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
            style={{ background: bannerColor ?? DEFAULT_BANNER_TO }}
          />
        </div>

        <div className="flex flex-1 flex-col px-4 pt-0 pb-4 sm:px-5 sm:pb-5">
          {/* Avatar 64px mobile / 80px desktop — même taille et même rendu (<img>
              brut, pas next/image) que le profil (profile-header.tsx) : next/image
              avec un sizes="64px" fixe re-compressait/limitait la résolution à 64px
              puis le zoom CSS (photoConfig.zoom) l'agrandissait par-dessus, ce qui
              rendait cet avatar visiblement plus flou/petit que sur la fiche
              athlète — correctif 2026-08-27, cf. le même souci sur AthleteAvatar
              (components/teams/athlete-avatar.tsx). Chevauche la bannière de 28px
              mobile / 32px desktop (-mt-7 / -mt-8). */}
          <div className="relative z-10 -mt-7 mb-2 flex justify-start sm:-mt-8">
            {athlete.photoUrl ? (
              <div
                className="relative size-16 shrink-0 overflow-hidden rounded-full border-[3px] border-white sm:size-20"
                style={{ boxShadow: AVATAR_SHADOW }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={athlete.photoUrl}
                  alt=""
                  loading="lazy"
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
                className="flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-primary text-lg font-bold text-white sm:size-20 sm:text-xl"
                style={{ boxShadow: AVATAR_SHADOW }}
              >
                {initials(athlete.firstName, athlete.lastName)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-bold sm:text-lg">
              {athlete.firstName} {athlete.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {age !== null ? `${age} ans` : 'Âge inconnu'}
              {athlete.gender ? ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}` : ''}
            </div>
          </div>

          {/* Pills disciplines : couleur neutre volontairement identique pour
              toutes, on ignore athlete.disciplineColors ici — les couleurs
              personnalisées ne s'appliquent que sur le profil /athletes/[id],
              jamais sur cette card de liste. */}
          {athlete.disciplines.length > 0 && (
            <div className="mt-3 mb-3 flex flex-wrap gap-1.5">
              {athlete.disciplines.slice(0, 4).map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-[#a78bfa]"
                >
                  {DISCIPLINE_LABELS[d] ?? d}
                </span>
              ))}
              {athlete.disciplines.length > 4 && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-[#a78bfa]">
                  +{athlete.disciplines.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <StatCell icon={CalendarDays} value={athlete.sessionsCount} label="Séances" />
            <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
            <StatCell icon={TrendingUp} value={athlete.performancesCount} label="Perfs" />
            <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
            <StatCell icon={Target} value={athlete.goalsCount} label="Objectifs" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function StatCell({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center">
      <span className="flex items-center gap-1 text-lg font-bold text-foreground sm:text-xl">
        <Icon className="size-3.5 text-[#a78bfa] sm:size-4" />
        {value}
      </span>
      <span className="text-xs text-muted-foreground uppercase" style={{ letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  )
}

export const AthleteCard = memo(AthleteCardImpl)
