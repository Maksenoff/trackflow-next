import { CalendarDays, LineChart, Trophy, Vote } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wordmark } from '@/components/logo'

const FEATURES = [
  { icon: CalendarDays, label: 'Calendriers entraînements & compétitions' },
  { icon: LineChart, label: 'Suivi de performance et synchro FFA' },
  { icon: Trophy, label: 'Podiums et objectifs de saison' },
  { icon: Vote, label: 'Votes et vie de club' },
]

// Fond "stats" léger : histogramme de progression + sparkline, très discrets,
// posés en fond de PAGE ENTIÈRE (pas confinés à une colonne) — en `fill-foreground`
// pour suivre le thème automatiquement, plutôt qu'une illustration littérale.
const STATS_VIEWBOX = { w: 1000, h: 700 }
const STATS_BAR_VALUES = [0.28, 0.4, 0.34, 0.5, 0.44, 0.6, 0.52, 0.7, 0.6, 0.8, 0.7, 0.9]
const STATS_BASE_Y = 560
const STATS_MAX_HEIGHT = 220
const STATS_BAR_WIDTH = 26
const STATS_GAP = 24
const STATS_START_X = 40

const STATS_BARS = STATS_BAR_VALUES.map((value, i) => {
  const height = value * STATS_MAX_HEIGHT
  return {
    x: STATS_START_X + i * (STATS_BAR_WIDTH + STATS_GAP),
    y: STATS_BASE_Y - height,
    height,
  }
})

const STATS_SPARK_POINTS = STATS_BARS.map(
  (bar) => `${bar.x + STATS_BAR_WIDTH / 2},${bar.y - 14}`
).join(' ')

// Lignes de couloir façon piste d'athlétisme : quelques diagonales fines qui
// traversent TOUTE la page (pas cantonnées à un panneau), ancrage sportif discret
// qui unifie visuellement les deux moitiés plutôt que de les séparer.
const LANE_LINES = [
  { top: '8%', rotate: '-6deg', width: '140%' },
  { top: '34%', rotate: '-6deg', width: '140%' },
  { top: '60%', rotate: '-6deg', width: '140%' },
  { top: '86%', rotate: '-6deg', width: '140%' },
]

// Particules qui montent lentement en fond — présentes sur toute la largeur,
// mouvement lent et discret, seul élément animé du fond décoratif.
const PARTICLES = [
  { left: '6%', size: 4, duration: '18s', delay: '0s' },
  { left: '16%', size: 3, duration: '22s', delay: '3s' },
  { left: '29%', size: 5, duration: '19s', delay: '7s' },
  { left: '41%', size: 3, duration: '24s', delay: '1.5s' },
  { left: '54%', size: 4, duration: '20s', delay: '9s' },
  { left: '67%', size: 3, duration: '23s', delay: '5s' },
  { left: '79%', size: 5, duration: '21s', delay: '11s' },
  { left: '91%', size: 3, duration: '25s', delay: '2.5s' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Fond partagé par toute la page — un seul canevas continu, pas deux panneaux
          colorés recollés : plus de "trait" possible entre marque et formulaire. Tout
          est thémé via les tokens (foreground/primary) donc fonctionne nativement en
          clair et en sombre. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.09] dark:opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            color: 'var(--foreground)',
          }}
        />
        <div className="animate-brand-orb absolute top-[-12%] left-[-6%] size-[34rem] rounded-full bg-violet-600/[0.18] blur-[110px] dark:bg-violet-600/25" />
        <div
          className="animate-brand-orb absolute top-1/3 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.12] blur-[130px] dark:bg-fuchsia-600/15"
          style={{ animationDuration: '17s', animationDelay: '2s' }}
        />
        <div
          className="animate-brand-orb absolute right-[-8%] bottom-[-10%] size-[30rem] rounded-full bg-violet-600/[0.15] blur-[110px] dark:bg-violet-600/20"
          style={{ animationDuration: '20s', animationDelay: '4s' }}
        />

        {/* Lignes de couloir — traversent toute la largeur en diagonale */}
        {LANE_LINES.map((lane, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-foreground/[0.12] to-transparent"
            style={{
              top: lane.top,
              left: '-20%',
              width: lane.width,
              transform: `rotate(${lane.rotate})`,
            }}
          />
        ))}

        {/* Histogramme + sparkline de fond */}
        <svg
          viewBox={`0 0 ${STATS_VIEWBOX.w} ${STATS_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          {STATS_BARS.map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={STATS_BAR_WIDTH}
              height={bar.height}
              rx="5"
              className="fill-foreground"
              opacity="0.07"
            />
          ))}
          <polyline
            points={STATS_SPARK_POINTS}
            fill="none"
            stroke="url(#stats-spark-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />
          {STATS_BARS.map((bar, i) => (
            <circle
              key={i}
              cx={bar.x + STATS_BAR_WIDTH / 2}
              cy={bar.y - 14}
              r="3"
              fill="#a78bfa"
              opacity="0.4"
            />
          ))}
          <defs>
            <linearGradient id="stats-spark-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>

        {/* Particules qui remontent doucement */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="animate-brand-particle absolute bottom-0 rounded-full bg-violet-500 dark:bg-violet-300"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Wordmark centré en haut de page, à l'échelle — plus le petit logo planqué
          dans un coin de colonne */}
      <div className="relative z-10 hidden justify-center pt-10 lg:flex">
        <Wordmark className="h-10 w-auto text-foreground xl:h-12" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-10 sm:px-8 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:px-12 xl:px-16">
        {/* Colonne de marque — sur le même fond que le formulaire, pas de panneau à part */}
        <div className="hidden flex-col lg:flex">
          <div className="space-y-8">
            <p className="max-w-md pt-1 pr-2 pb-2 text-4xl leading-[1.4] font-black tracking-tight text-foreground italic xl:text-5xl">
              LA PERFORMANCE,
              <br />
              <span className="inline-block bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text pr-1 pb-1 text-transparent dark:from-violet-400 dark:to-fuchsia-300">
                TRACÉE AU MILLIMÈTRE.
              </span>
            </p>
            <ul className="space-y-3.5">
              {FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                    <f.icon className="size-4.5 text-violet-600 dark:text-violet-400" />
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colonne formulaire */}
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/icon.svg"
              alt=""
              aria-hidden
              className="size-14 rounded-xl shadow-lg shadow-primary/20"
            />
            <Wordmark className="h-5 w-auto text-foreground" />
          </div>
          {children}
        </div>
      </div>

      {/* Pinné bas-gauche de la page, indépendant du flux — desktop uniquement */}
      <p className="absolute bottom-6 left-4 z-10 hidden text-xs font-medium text-muted-foreground/70 sm:left-8 lg:block lg:left-12 xl:left-16">
        TrackFlow — Suivi de performance athlétique
      </p>
    </div>
  )
}
