/**
 * Pictogrammes SVG par discipline, portés depuis le repo Symfony (macro Twig
 * `banner_pattern.html.twig`, fournie par Maksen le 2026-08-25). D'abord posés
 * en filigrane sur la bannière du profil, puis déplacés (toujours le 2026-08-25,
 * même session) sur les bandeaux de discipline de l'onglet Performances — un
 * seul pictogramme par bandeau plutôt que 3 copies en filigrane de bannière.
 * Les chemins sont copiés tels quels (mêmes coordonnées), seuls les attributs
 * SVG sont passés en camelCase pour JSX.
 */

export type PatternType =
  | 'sprint'
  | 'haies'
  | 'hauteur'
  | 'perche'
  | 'longueur'
  | 'triple'
  | 'javelot'
  | 'disque'
  | 'poids'
  | 'marteau'

/**
 * viewBox recadré sur la zone réellement dessinée de chaque pictogramme (les
 * tracés d'origine, pensés pour occuper toute la hauteur d'une bannière,
 * laissent beaucoup de vide une fois affichés dans un bandeau de discipline
 * ~4x plus bas — correctif 2026-08-25, sinon le motif n'occupait qu'un
 * mince filet à peine visible).
 */
const FOCUS_VIEWBOX: Record<PatternType, string> = {
  sprint: '0 40 160 60',
  haies: '0 38 160 58',
  hauteur: '0 4 100 96',
  perche: '0 0 160 100',
  longueur: '0 62 100 36',
  triple: '0 38 100 60',
  javelot: '0 10 160 84',
  disque: '0 28 100 66',
  poids: '0 16 100 80',
  marteau: '0 8 100 82',
}

/**
 * Toutes les épreuves courues (sprints, demi-fond/fond, relais, cross...)
 * partagent le même pictogramme "sprint" (starting-blocks + ligne d'arrivée)
 * plutôt qu'un pictogramme par distance — demande explicite de Maksen.
 */
export function patternTypeForDiscipline(discipline: string): PatternType {
  if (discipline.startsWith('poids')) return 'poids'
  if (discipline.startsWith('disque')) return 'disque'
  if (discipline.startsWith('javelot')) return 'javelot'
  if (discipline.startsWith('marteau')) return 'marteau'
  if (
    discipline === 'longueur' ||
    discipline === 'hauteur' ||
    discipline === 'triple' ||
    discipline === 'perche'
  ) {
    return discipline
  }
  if (discipline.includes('haies')) return 'haies'
  return 'sprint'
}

const PATTERN_INNER: Record<PatternType, React.ReactNode> = {
  sprint: (
    <>
      <path d="M4 84 H156" opacity=".55" strokeWidth="2.2" />
      <path d="M4 92 H156" opacity=".3" strokeWidth="1.6" />
      <path d="M4 76 H156" opacity=".25" strokeWidth="1.4" />
      <path d="M36 84 L124 84" strokeWidth="4" />
      <path d="M122 84 L132 84 L128 92 L118 92 Z" fill="currentColor" opacity=".85" />
      <path d="M28 84 L40 84 L36 92 L24 92 Z" fill="currentColor" opacity=".85" />
      <path d="M46 84 L46 50 L72 72 L72 84 Z" fill="currentColor" />
      <circle cx="46" cy="84" r="3" fill="currentColor" />
      <path d="M80 84 L80 60 L108 78 L108 84 Z" fill="currentColor" opacity=".78" />
      <circle cx="80" cy="84" r="3" fill="currentColor" />
      <path d="M52 92 L52 96" strokeWidth="2" />
      <path d="M88 92 L88 96" strokeWidth="2" />
      <path d="M116 92 L116 96" strokeWidth="2" />
    </>
  ),
  haies: (
    <>
      <path d="M4 88 H156" opacity=".45" strokeWidth="1.8" />
      <g strokeWidth="2.4">
        <path d="M4 88 H32" strokeWidth="3" />
        <path d="M10 88 V44" />
        <path d="M26 88 V44" />
        <path d="M4 44 H32" strokeWidth="4.5" />
      </g>
      <g strokeWidth="2.2">
        <path d="M52 88 H78" strokeWidth="2.6" />
        <path d="M57 88 V50" />
        <path d="M73 88 V50" />
        <path d="M52 50 H78" strokeWidth="3.8" />
      </g>
      <g strokeWidth="1.8" opacity=".9">
        <path d="M96 88 H120" strokeWidth="2.2" />
        <path d="M101 88 V56" />
        <path d="M115 88 V56" />
        <path d="M96 56 H120" strokeWidth="3.2" />
      </g>
      <g strokeWidth="1.5" opacity=".7">
        <path d="M134 88 H154" strokeWidth="1.8" />
        <path d="M138 88 V62" />
        <path d="M150 88 V62" />
        <path d="M134 62 H154" strokeWidth="2.6" />
      </g>
    </>
  ),
  hauteur: (
    <>
      <path d="M12 88 L88 88 L82 76 L18 76 Z" opacity=".55" />
      <path d="M18 76 L18 72 L82 72 L82 76" opacity=".45" />
      <path d="M22 72 V28" strokeWidth="3" />
      <path d="M78 72 V28" strokeWidth="3" />
      <path d="M14 72 H30" strokeWidth="2.2" />
      <path d="M70 72 H86" strokeWidth="2.2" />
      <path d="M20 40 H80" strokeWidth="4" />
      <circle cx="22" cy="40" r="3" fill="currentColor" stroke="none" />
      <circle cx="78" cy="40" r="3" fill="currentColor" stroke="none" />
      <path d="M14 40 L8 40 M8 40 L8 72" opacity=".5" strokeWidth="1.2" />
      <path d="M6 40 H10" strokeWidth="1.2" opacity=".5" />
      <path d="M6 72 H10" strokeWidth="1.2" opacity=".5" />
    </>
  ),
  perche: (
    <>
      <ellipse cx="20" cy="94" rx="12" ry="2" opacity=".35" />
      <path d="M10 88 L150 18" strokeWidth="4" />
      <path d="M10 84 L150 14" strokeWidth="1" opacity=".45" />
      <path d="M6 90 L18 84 L14 94 Z" fill="currentColor" />
      <circle cx="150" cy="18" r="4" fill="currentColor" />
      <path d="M68 54 L92 42" strokeWidth="10" opacity=".3" />
      <path d="M70 54 L90 44" strokeWidth="1" opacity=".85" />
      <path d="M72 56 L92 46" strokeWidth="1" opacity=".85" />
      <path d="M74 58 L94 48" strokeWidth="1" opacity=".85" />
      <path d="M76 60 L96 50" strokeWidth="1" opacity=".85" />
      <path d="M30 80 Q70 66 120 34" strokeDasharray="2 3" opacity=".35" strokeWidth="1.2" />
    </>
  ),
  longueur: (
    <>
      <path d="M4 74 H26" strokeWidth="2.5" />
      <path d="M26 70 L34 70 L34 78 L26 78 Z" fill="currentColor" />
      <path d="M34 74 H96" strokeWidth="2.5" />
      <path d="M34 90 H96" strokeWidth="2.5" />
      <path d="M34 74 V90" strokeWidth="2.5" />
      <path d="M96 74 V90" strokeWidth="2.5" />
      <g strokeWidth="1.4" opacity=".85">
        <path d="M38 82 L42 78 L46 82 L50 78 L54 82 L58 78 L62 82 L66 78 L70 82 L74 78 L78 82 L82 78 L86 82 L90 78 L94 82" />
        <path
          d="M38 88 L42 84 L46 88 L50 84 L54 88 L58 84 L62 88 L66 84 L70 88 L74 84 L78 88 L82 84 L86 88 L90 84 L94 88"
          opacity=".75"
        />
      </g>
      <path d="M56 78 L62 86 L68 78" strokeWidth="1.8" opacity=".95" />
      <path d="M34 66 H96" strokeDasharray="3 3" opacity=".5" strokeWidth="1.2" />
    </>
  ),
  triple: (
    <>
      <path d="M4 74 H18" strokeWidth="2.5" />
      <path d="M18 70 L24 70 L24 78 L18 78 Z" fill="currentColor" />
      <path d="M24 74 H72" strokeWidth="2.5" />
      <path d="M72 74 H96 M72 90 H96 M72 74 V90 M96 74 V90" strokeWidth="2.5" />
      <g strokeWidth="1.2" opacity=".7">
        <path d="M75 82 L79 78 L83 82 L87 78 L91 82 L95 78" />
        <path d="M75 88 L79 84 L83 88 L87 84 L91 88 L95 84" opacity=".7" />
      </g>
      <ellipse cx="32" cy="74" rx="4" ry="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="50" cy="74" rx="4" ry="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="68" cy="74" rx="4" ry="1.6" fill="currentColor" stroke="none" />
      <path d="M24 70 Q32 56 40 70" strokeDasharray="2 2.5" opacity=".6" strokeWidth="1.4" />
      <path d="M40 70 Q52 50 60 70" strokeDasharray="2 2.5" opacity=".6" strokeWidth="1.4" />
      <path d="M60 70 Q72 42 88 70" strokeDasharray="2 2.5" opacity=".75" strokeWidth="1.4" />
    </>
  ),
  javelot: (
    <>
      <polygon points="14,82 12,78 150,22 152,26" fill="currentColor" strokeWidth="0.6" />
      <polygon points="148,28 158,18 152,22 150,20" fill="currentColor" strokeLinejoin="round" />
      <path d="M150 22 L156 18" strokeWidth="1.2" opacity=".55" />
      <polygon points="71,62 75,53 95,45 91,54" fill="currentColor" opacity=".8" />
      <g strokeWidth="0.8" opacity=".95">
        <path d="M75 60 L78 53" />
        <path d="M79 58 L82 51" />
        <path d="M83 56 L86 49" />
        <path d="M87 54 L90 47" />
        <path d="M91 52 L94 45" />
      </g>
      <path d="M12 82 L8 86" strokeWidth="1.4" opacity=".7" />
    </>
  ),
  disque: (
    <>
      <ellipse cx="50" cy="86" rx="34" ry="4" opacity=".35" />
      <ellipse cx="50" cy="46" rx="38" ry="13" fill="currentColor" opacity=".22" />
      <ellipse cx="50" cy="46" rx="38" ry="13" strokeWidth="2.6" />
      <path
        d="M12 46 L12 52 Q12 58 24 62 Q50 70 76 62 Q88 58 88 52 L88 46"
        strokeWidth="2.4"
        fill="currentColor"
        fillOpacity=".35"
      />
      <ellipse cx="50" cy="46" rx="11" ry="4" strokeWidth="1.8" />
      <ellipse cx="50" cy="46" rx="6" ry="2" fill="currentColor" stroke="none" opacity=".85" />
      <circle cx="50" cy="46" r="1.4" fill="currentColor" stroke="none" />
      <path d="M28 40 Q42 35 60 35" strokeWidth="1.6" opacity=".55" />
    </>
  ),
  poids: (
    <>
      <ellipse cx="50" cy="88" rx="30" ry="4" opacity=".4" />
      <circle cx="50" cy="50" r="30" fill="currentColor" />
      <path d="M22 54 Q30 76 50 80 Q70 76 78 54" strokeWidth="1.6" opacity=".35" fill="none" />
      <ellipse
        cx="40"
        cy="36"
        rx="10"
        ry="6"
        strokeWidth="1.2"
        opacity=".5"
        fill="none"
        transform="rotate(-25 40 36)"
      />
      <ellipse
        cx="40"
        cy="36"
        rx="5"
        ry="3"
        strokeWidth="1"
        opacity=".8"
        fill="none"
        transform="rotate(-25 40 36)"
      />
      <circle cx="38" cy="34" r="1.6" fill="currentColor" stroke="none" opacity=".9" />
    </>
  ),
  marteau: (
    <>
      <circle cx="24" cy="70" r="14" fill="currentColor" />
      <path d="M14 74 Q24 82 34 74" strokeWidth="1.4" opacity=".4" fill="none" />
      <ellipse cx="18" cy="64" rx="4" ry="3" strokeWidth="1" opacity=".7" fill="none" />
      <circle cx="36" cy="62" r="2.5" fill="currentColor" stroke="none" />
      <path d="M36 62 L78 26" strokeWidth="2" />
      <path d="M78 26 L94 14 L90 30 Z" fill="currentColor" />
      <path d="M82 24 L88 20" strokeWidth="2" opacity=".45" />
    </>
  ),
}

/** Un seul pictogramme SVG (pas de filigrane à copies multiples), coloré via currentColor. */
export function DisciplinePictogram({
  discipline,
  className,
  style,
}: {
  discipline: string
  className?: string
  style?: React.CSSProperties
}) {
  const type = patternTypeForDiscipline(discipline)
  return (
    <svg
      aria-hidden
      viewBox={FOCUS_VIEWBOX[type]}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className={className}
      style={style}
    >
      {PATTERN_INNER[type]}
    </svg>
  )
}
