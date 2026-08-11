// Port fidèle de Performance::ATHLETE_SPECIALTIES (repo Symfony, src/Entity/Performance.php)

export const ATHLETE_SPECIALTIES: Record<string, Record<string, string>> = {
  Sprints: {
    '50m': '50m',
    '60m': '60m',
    '80m': '80m',
    '100m': '100m',
    '150m': '150m',
    '200m': '200m',
    '300m': '300m',
    '400m': '400m',
  },
  'Demi-fond / Fond': {
    '600m': '600m',
    '800m': '800m',
    '1000m': '1000m',
    '1500m': '1500m',
    '2000m': '2000m',
    '3000m': '3000m',
    '5000m': '5000m',
    '10000m': '10000m',
    'Semi-marathon': 'semi-marathon',
    Marathon: 'marathon',
  },
  Haies: {
    '50m haies': '50m-haies',
    '60m haies': '60m-haies',
    '80m haies': '80m-haies',
    '100m haies (F)': '100m-haies',
    '110m haies (H)': '110m-haies',
    '400m haies': '400m-haies',
  },
  Sauts: {
    'Saut en longueur': 'longueur',
    'Saut en hauteur': 'hauteur',
    'Triple saut': 'triple',
    'Saut à la perche': 'perche',
  },
  Lancers: {
    'Lancer de poids': 'poids',
    'Lancer du disque': 'disque',
    'Lancer du javelot': 'javelot',
    'Lancer du marteau': 'marteau',
  },
  'Épreuves combinées': {
    Décathlon: 'decathlon',
    Heptathlon: 'heptathlon',
    Pentathlon: 'pentathlon',
    Triathlon: 'triathlon',
  },
  Autres: {
    'Cross country': 'cross',
    Marche: 'marche',
    'Relais 4x60m': '4x60m',
    'Relais 4x80m': '4x80m',
    'Relais 4x100m': '4x100m',
    'Relais 4x200m': '4x200m',
    'Relais 4x400m': '4x400m',
    Autre: 'autre',
  },
}

export const DISCIPLINE_LABELS: Record<string, string> = Object.values(ATHLETE_SPECIALTIES).reduce(
  (acc, group) => {
    for (const [label, value] of Object.entries(group)) acc[value] = label
    return acc
  },
  {} as Record<string, string>
)

/**
 * Filtre les groupes de disciplines standard pour ne garder que les codes fournis
 * (restriction `Competition.availableDisciplines`), et regroupe les codes inconnus
 * (épreuves personnalisées) sous "Personnalisées" — reproduit
 * `CompetitionController::show()` (repo Symfony).
 */
export function filterDisciplineGroups(codes: string[]): Record<string, Record<string, string>> {
  if (codes.length === 0) return ATHLETE_SPECIALTIES

  const codeSet = new Set(codes)
  const groups: Record<string, Record<string, string>> = {}

  for (const [groupLabel, entries] of Object.entries(ATHLETE_SPECIALTIES)) {
    const filtered = Object.fromEntries(
      Object.entries(entries).filter(([, code]) => codeSet.has(code))
    )
    if (Object.keys(filtered).length > 0) groups[groupLabel] = filtered
  }

  const knownCodes = new Set(Object.values(ATHLETE_SPECIALTIES).flatMap((g) => Object.values(g)))
  const customCodes = codes.filter((c) => !knownCodes.has(c))
  if (customCodes.length > 0) {
    groups['Personnalisées'] = Object.fromEntries(customCodes.map((c) => [c, c]))
  }

  return groups
}

/** Palette de couleurs vives pour les pastilles de discipline (choix Maksen). */
export const DEFAULT_DISCIPLINE_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e']
