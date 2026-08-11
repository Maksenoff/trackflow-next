'use client'

import Link from 'next/link'
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

export function AthleteCard({ athlete, index = 0 }: { athlete: AthleteCardData; index?: number }) {
  const age = calcAge(athlete.birthDate)
  const bannerColor = athlete.bannerConfig.color ?? '#6366f1'
  const isPhotoBanner = athlete.bannerConfig.mode === 'photo' && athlete.bannerUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/athletes/${athlete.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
        <div className="relative z-0 h-24 overflow-hidden">
          <div
            className="absolute inset-0 scale-100 transition-transform duration-500 ease-out group-hover:scale-110"
            style={
              isPhotoBanner
                ? {
                    backgroundImage: `url(${athlete.bannerUrl})`,
                    backgroundSize: `${(athlete.bannerConfig.zoom ?? 1) * 100}%`,
                    backgroundPosition: `${athlete.bannerConfig.x ?? 50}% ${athlete.bannerConfig.y ?? 50}%`,
                  }
                : {
                    background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}33)`,
                  }
            }
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
            style={{ background: bannerColor }}
          />
        </div>

        <div className="flex-1 px-5 pt-0 pb-5">
          <div className="relative z-10 -mt-7 mb-2 flex justify-start">
            {athlete.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={athlete.photoUrl}
                alt=""
                className="size-14 shrink-0 rounded-full object-cover ring-4 ring-card shadow-md"
                style={{
                  objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                  transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                  transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                }}
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground ring-4 ring-card shadow-md">
                {initials(athlete.firstName, athlete.lastName)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-bold">
              {athlete.firstName} {athlete.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {age !== null ? `${age} ans` : 'Âge inconnu'}
              {athlete.gender ? ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}` : ''}
            </div>
          </div>

          {athlete.disciplines.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {athlete.disciplines.slice(0, 4).map((d) => {
                const color = athlete.disciplineColors[d] ?? '#6366f1'
                return (
                  <span
                    key={d}
                    className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${color}18`,
                      color,
                      borderColor: `${color}40`,
                    }}
                  >
                    {DISCIPLINE_LABELS[d] ?? d}
                  </span>
                )
              })}
              {athlete.disciplines.length > 4 && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  +{athlete.disciplines.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-3">
            <StatCell icon={CalendarDays} value={athlete.sessionsCount} label="Séances" />
            <StatCell icon={TrendingUp} value={athlete.performancesCount} label="Perfs" />
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
    <div className="flex flex-col items-center gap-0.5 px-1 text-center first:pl-0 last:pr-0">
      <span className="flex items-center gap-1 text-sm font-bold">
        <Icon className="size-3 text-muted-foreground" />
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
