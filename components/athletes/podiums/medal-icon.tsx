import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { MedalRank } from './medal-colors'

/**
 * Médaille SVG (ruban + disque métallique) — remplace le disque plat
 * "dégradé radial + chiffre" jugé pas assez "réel" pour une médaille
 * (retour Maksen 2026-09-20, onglet Podiums pas assez pro/sport). Dégradé
 * linéaire à 3 tons (clair/base/foncé) plutôt que le radial "bonbon"
 * précédent — lit comme du métal brossé, pas du plastique brillant. Chiffre
 * en relief via une couche d'ombre légèrement décalée sous le texte plein.
 */
const METAL: Record<
  MedalRank,
  { light: string; base: string; dark: string; rim: string; text: string }
> = {
  1: { light: '#f3d27a', base: '#d4a12b', dark: '#8a611a', rim: '#6b4a14', text: '#3d2a0c' },
  2: { light: '#e7ebf0', base: '#a7b2bf', dark: '#68727d', rim: '#4b525a', text: '#252a2f' },
  3: { light: '#d9a374', base: '#b06b3d', dark: '#7a4726', rim: '#5c351d', text: '#2f1c10' },
}

export function MedalIcon({
  rank,
  size = 36,
  ribbon = false,
  className,
}: {
  rank: number
  size?: number
  /** Ruban replié au-dessus du disque — pour la scène podium uniquement, pas
   * pour les badges compacts (liste, pastilles). */
  ribbon?: boolean
  className?: string
}) {
  const uid = useId()
  const metal = METAL[(rank in METAL ? rank : 3) as MedalRank]
  const gradId = `medal-${uid}`
  const h = ribbon ? size * 1.3 : size
  const cy = ribbon ? 74 : 50
  const viewBox = ribbon ? '0 0 100 130' : '0 0 100 100'

  return (
    <svg
      width={size}
      height={h}
      viewBox={viewBox}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="18%" y1="8%" x2="88%" y2="96%">
          <stop offset="0%" stopColor={metal.light} />
          <stop offset="48%" stopColor={metal.base} />
          <stop offset="100%" stopColor={metal.dark} />
        </linearGradient>
      </defs>

      {ribbon && (
        <g>
          <path d="M32 0 L50 52 L18 38 Z" fill={metal.rim} fillOpacity={0.85} />
          <path d="M68 0 L50 52 L82 38 Z" fill={metal.rim} fillOpacity={0.65} />
        </g>
      )}

      <circle
        cx="50"
        cy={cy}
        r="33"
        fill={`url(#${gradId})`}
        stroke={metal.rim}
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy={cy}
        r="26"
        fill="none"
        stroke={metal.rim}
        strokeOpacity="0.3"
        strokeWidth="1.25"
      />

      <text
        x="50"
        y={cy + 10.5}
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill={metal.rim}
        fillOpacity="0.45"
      >
        {rank}
      </text>
      <text
        x="50"
        y={cy + 9.5}
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill={metal.text}
      >
        {rank}
      </text>
    </svg>
  )
}
