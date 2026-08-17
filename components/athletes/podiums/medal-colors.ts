export type MedalRank = 1 | 2 | 3

export type MedalStyle = {
  /** Dégradé métallique pour le disque de la médaille / badge de rang. */
  disc: string
  /** Couleur d'accent pleine (anneau, bordure gauche, texte). */
  ring: string
  /** Dégradé pour le fond de la marche du podium. */
  step: string
  /** Bordure de la marche du podium. */
  border: string
  /** Ombre portée colorée, pour l'effet "brillant". */
  glow: string
  /** Couleur du texte sur le disque (contraste). */
  text: string
  /** Nom court affiché (Or / Argent / Bronze). */
  label: string
}

export const MEDAL_GRADIENTS: Record<MedalRank, MedalStyle> = {
  1: {
    disc: 'radial-gradient(circle at 32% 26%, #fffde7 0%, #ffe066 16%, #fbbf24 42%, #d97706 72%, #92400e 100%)',
    ring: '#f59e0b',
    step: 'linear-gradient(165deg, rgba(251,191,36,0.35), rgba(217,119,6,0.06))',
    border: 'rgba(245,158,11,0.5)',
    glow: '0 12px 28px -8px rgba(245,158,11,0.65)',
    text: '#4a2e00',
    label: 'Or',
  },
  2: {
    disc: 'radial-gradient(circle at 32% 26%, #ffffff 0%, #eef2f6 16%, #c3ccd6 42%, #8b97a5 72%, #4b5563 100%)',
    ring: '#94a3b8',
    step: 'linear-gradient(165deg, rgba(148,163,184,0.35), rgba(71,85,105,0.06))',
    border: 'rgba(148,163,184,0.5)',
    glow: '0 12px 28px -8px rgba(100,116,139,0.55)',
    text: '#1e293b',
    label: 'Argent',
  },
  3: {
    disc: 'radial-gradient(circle at 32% 26%, #ffe8cf 0%, #f0a866 16%, #c9773c 42%, #954a1f 72%, #5c2b0c 100%)',
    ring: '#c2703d',
    step: 'linear-gradient(165deg, rgba(194,112,61,0.35), rgba(92,43,12,0.06))',
    border: 'rgba(194,112,61,0.5)',
    glow: '0 12px 28px -8px rgba(154,82,38,0.6)',
    text: '#3a1a05',
    label: 'Bronze',
  },
}
