/** Motifs de fond décoratifs (piste courbe / anneau ovale) — repris du mockup
 *  trackflow-dashboard-final.html (.bgart) : lignes en `currentColor` +
 *  `--nu-art` (boost d'opacité au survol via `.nu-track-lines`, voir
 *  globals.css), plus le petit coureur qui parcourt la piste en boucle
 *  (`<animateMotion>`) sur les heroes (absent des side cards, fidèle à
 *  l'original). */
type Runner = { path: string; durationSeconds: number; fade?: boolean; opacity?: number }

function Runner({ path, durationSeconds, fade = true, opacity = 0 }: Runner) {
  return (
    <circle r={5} fill="var(--nu-acc)" opacity={fade ? 0 : opacity}>
      <animateMotion dur={`${durationSeconds}s`} repeatCount="indefinite" path={path} />
      {fade && (
        <animate
          attributeName="opacity"
          values="0;.9;.9;0"
          keyTimes="0;.1;.82;1"
          dur={`${durationSeconds}s`}
          repeatCount="indefinite"
        />
      )}
    </circle>
  )
}

export function TrackBendArt({ className, runner }: { className?: string; runner?: Runner }) {
  return (
    <svg
      viewBox="0 0 600 440"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', pointerEvents: 'none', color: 'var(--nu-txt)' }}
    >
      <g
        className="nu-track-lines"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity="var(--nu-art)"
      >
        <path d="M0 380 H520 A60 60 0 0 0 460 440" />
        <path d="M0 330 H520 A110 110 0 0 0 410 440" />
        <path d="M0 280 H520 A160 160 0 0 0 360 440" />
        <path d="M0 230 H520 A210 210 0 0 0 310 440" />
        <path d="M0 180 H520 A260 260 0 0 0 260 440" />
        <path d="M0 130 H520 A310 310 0 0 0 210 440" />
        <path d="M0 80 H520 A360 360 0 0 0 160 440" />
      </g>
      {runner && <Runner {...runner} />}
    </svg>
  )
}

export function TrackOvalArt({ className, runner }: { className?: string; runner?: Runner }) {
  return (
    <svg
      viewBox="0 0 440 310"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', pointerEvents: 'none', color: 'var(--nu-txt)' }}
    >
      <g className="nu-track-lines" stroke="currentColor" strokeWidth={1.7} opacity="var(--nu-art)">
        <path d="M120 65 H320 A90 90 0 0 1 320 245 H120 A90 90 0 0 1 120 65 Z" />
        <path d="M138 83 H302 A72 72 0 0 1 302 227 H138 A72 72 0 0 1 138 83 Z" />
        <path d="M156 101 H284 A54 54 0 0 1 284 209 H156 A54 54 0 0 1 156 101 Z" />
        <path d="M174 119 H266 A36 36 0 0 1 266 191 H174 A36 36 0 0 1 174 119 Z" />
        <path d="M232 83 V227" strokeDasharray="4 7" />
      </g>
      {runner && <Runner {...runner} />}
    </svg>
  )
}
