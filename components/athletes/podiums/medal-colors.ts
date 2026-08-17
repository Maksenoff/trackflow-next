export type MedalRank = 1 | 2 | 3

export type MedalStyle = {
  /** Dégradé métallique pour le disque de la médaille / badge de rang. */
  disc: string
  /** Couleur d'accent (anneau, bordure). */
  ring: string
  /** Dégradé subtil pour le fond de la marche du podium. */
  step: string
  /** Bordure de la marche du podium. */
  border: string
  /** Ombre portée colorée, pour l'effet "brillant". */
  glow: string
  /** Couleur du texte sur le disque (contraste). */
  text: string
}

export const MEDAL_GRADIENTS: Record<MedalRank, MedalStyle> = {
  1: {
    disc: 'radial-gradient(circle at 32% 28%, #fffbea 0%, #ffe066 18%, #f7b733 46%, #c98a12 76%, #8a5a06 100%)',
    ring: '#f5b301',
    step: 'linear-gradient(180deg, rgba(250,204,21,0.30), rgba(202,138,4,0.05))',
    border: 'rgba(234,179,8,0.45)',
    glow: '0 10px 24px -8px rgba(234,179,8,0.55)',
    text: '#5c3d00',
  },
  2: {
    disc: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #f1f5f9 20%, #cbd5e1 48%, #94a3b8 78%, #5b6b80 100%)',
    ring: '#9aa8ba',
    step: 'linear-gradient(180deg, rgba(148,163,184,0.30), rgba(71,85,105,0.05))',
    border: 'rgba(148,163,184,0.5)',
    glow: '0 10px 24px -8px rgba(100,116,139,0.5)',
    text: '#334155',
  },
  3: {
    disc: 'radial-gradient(circle at 32% 28%, #ffe3c2 0%, #f2b06a 20%, #d17f3d 48%, #a15c2a 78%, #6b3610 100%)',
    ring: '#c2703d',
    step: 'linear-gradient(180deg, rgba(194,112,61,0.30), rgba(107,54,16,0.05))',
    border: 'rgba(194,112,61,0.5)',
    glow: '0 10px 24px -8px rgba(161,92,42,0.5)',
    text: '#4a2408',
  },
}
