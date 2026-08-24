'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { CountUp } from '@/components/dashboard/count-up'
import { ROLE_LABELS, type Role } from '@/lib/roles'

// Petit histogramme + sparkline en transparence — même langage visuel que le
// panneau de marque de l'écran de connexion (app/(auth)/layout.tsx), pour que
// le dashboard ait le même "impact" à l'arrivée après connexion.
const BAR_VALUES = [0.3, 0.42, 0.36, 0.55, 0.46, 0.68, 0.58, 0.8, 0.66, 0.9]
const BASE_Y = 92
const MAX_H = 60
const BAR_W = 10
const GAP = 6
const START_X = 8

const BARS = BAR_VALUES.map((v, i) => {
  const h = v * MAX_H
  return { x: START_X + i * (BAR_W + GAP), y: BASE_Y - h, h }
})
const SPARK_POINTS = BARS.map((b) => `${b.x + BAR_W / 2},${b.y - 6}`).join(' ')

export function DashboardHeader({
  firstName,
  roles,
  view,
  totalAthletes,
  today,
}: {
  firstName: string | null
  roles: Role[]
  view: 'athlete' | 'coach'
  totalAthletes: number | null
  today: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      // Inversion de couleur entre thèmes, même esprit que la card de connexion
      // (components/auth/login-form.tsx) : light = dégradé clair (blanc → violet
      // très pâle), texte sombre, ombre douce ; dark = dégradé sombre (violet
      // profond → quasi-noir), texte blanc, ombre marquée. Pas un bandeau
      // "toujours sombre" figé — un vrai dégradé propre à chaque thème.
      className="relative flex min-h-[120px] flex-col justify-center overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#ffffff,#ede4fb)] p-6 text-foreground shadow-card lg:min-h-[160px] lg:p-8 dark:bg-[linear-gradient(135deg,#1a0a2e,#0d0618)] dark:text-white dark:shadow-xl"
    >
      {/* Graphique en fond — thémé comme le panneau de connexion : violet en
          light (visible sur le dégradé clair), blanc en dark (contraste sur le
          quasi-noir), plutôt que rester figé dans une seule teinte. */}
      <svg
        aria-hidden
        viewBox="0 0 300 100"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 size-full opacity-[0.18] dark:opacity-[0.12]"
      >
        {BARS.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={BAR_W}
            height={b.h}
            rx="2"
            className="fill-violet-500 dark:fill-white"
          />
        ))}
        <polyline
          points={SPARK_POINTS}
          fill="none"
          className="stroke-violet-500 dark:stroke-[#c4b5fd]"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground dark:text-white/70">
            {firstName ? `Bonjour, ${firstName}` : 'Bonjour'}
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-balance lg:text-5xl">
            Bienvenue sur{' '}
            <span className="inline-block bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text pr-3 text-transparent italic dark:from-violet-300 dark:to-fuchsia-300">
              TrackFlow
            </span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {roles.map((r) => (
              <span
                key={r}
                className="rounded-full border border-violet-600/30 bg-violet-600/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-100"
              >
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          {view === 'coach' && totalAthletes !== null && (
            <div className="flex items-baseline gap-1.5">
              <Users className="size-4 text-muted-foreground dark:text-white/80" />
              <span className="text-2xl font-extrabold tabular-nums">
                <CountUp value={totalAthletes} />
              </span>
              <span className="text-sm font-medium text-muted-foreground dark:text-white/70">
                athlète{totalAthletes > 1 ? 's' : ''} suivi{totalAthletes > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <p className="text-xs font-medium text-muted-foreground capitalize dark:text-white/70">
            {today}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
