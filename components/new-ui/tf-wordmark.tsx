/**
 * Wordmark "Trackflow" du nouveau front — reprend TEL QUEL la typographie de
 * l'ancien logo (`components/logo.tsx` → `Wordmark`, Arial Black italique) au
 * lieu d'un <div> HTML tronqué en CSS (retours Maksen 2026-09-19 répétés :
 * "pas la bonne typo" / "cache toujours la suite de TRACKFLOW"). Un <div> +
 * `truncate` coupe dur à une largeur en px ; un <svg viewBox> à largeur
 * `auto` ne peut structurellement jamais tronquer, il se redimensionne
 * toujours en entier — c'est la différence qui manquait, pas juste un
 * réglage de police. Un seul <text> avec deux <tspan> (au lieu de deux <text>
 * séparés) pour que "flow" s'enchaîne exactement après "Track" sans calcul de
 * position manuel, la seule couleur du second tspan changeant selon l'accent
 * choisi par l'utilisateur.
 */
import type { CSSProperties } from 'react'

export function TfWordmark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 210 40" className={className} style={style} aria-hidden focusable="false">
      <text
        x="0"
        y="30"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontSize="26"
        fontWeight={900}
        fontStyle="italic"
        letterSpacing="0.5"
        style={{ paintOrder: 'stroke', strokeWidth: 1.2 }}
      >
        <tspan fill="currentColor" stroke="currentColor">
          TRACK
        </tspan>
        <tspan fill="var(--nu-acc)" stroke="var(--nu-acc)">
          FLOW
        </tspan>
      </text>
    </svg>
  )
}
