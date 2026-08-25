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
    'Lancer de disque': 'disque',
    'Lancer de javelot': 'javelot',
    'Lancer de marteau': 'marteau',
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
    'Relais 4x60': '4x60m',
    'Relais 4x80': '4x80m',
    'Relais 4x100': '4x100m',
    'Relais 4x200': '4x200m',
    'Relais 4x400': '4x400m',
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

export type DisciplineCategory = {
  key: string
  label: string
  color: string
  disciplines: Record<string, string>
}

/**
 * Les 7 familles d'ATHLETE_SPECIALTIES, colorées (mêmes couleurs que
 * GOAL_DISCIPLINE_CATEGORIES ci-dessous) — pour les sélecteurs multi-choix qui
 * doivent proposer TOUTES les épreuves (compétitions, équipes), pas seulement
 * la restriction Espoir/Senior des objectifs athlète.
 */
export const DISCIPLINE_CATEGORIES: DisciplineCategory[] = [
  { key: 'sprints', label: 'Sprints', color: '#f97316', disciplines: ATHLETE_SPECIALTIES.Sprints },
  {
    key: 'demi-fond',
    label: 'Demi-fond / Fond',
    color: '#3b82f6',
    disciplines: ATHLETE_SPECIALTIES['Demi-fond / Fond'],
  },
  { key: 'haies', label: 'Haies', color: '#a855f7', disciplines: ATHLETE_SPECIALTIES.Haies },
  { key: 'sauts', label: 'Sauts', color: '#10b981', disciplines: ATHLETE_SPECIALTIES.Sauts },
  { key: 'lancers', label: 'Lancers', color: '#f43f5e', disciplines: ATHLETE_SPECIALTIES.Lancers },
  {
    key: 'combinees',
    label: 'Épreuves combinées',
    color: '#eab308',
    disciplines: ATHLETE_SPECIALTIES['Épreuves combinées'],
  },
  { key: 'autres', label: 'Autres', color: '#06b6d4', disciplines: ATHLETE_SPECIALTIES.Autres },
]

/**
 * Variantes de poids/hauteur de haies dérivées par `refineByCategory` (lib/ffa-scraper.ts)
 * selon la catégorie d'âge FFA — pas des disciplines sélectionnables dans le formulaire
 * athlète, mais des codes réels importés depuis athle.fr qui doivent s'afficher proprement.
 */
const DISCIPLINE_VARIANT_LABELS: Record<string, string> = {
  'poids-7kg': 'Lancer de poids (7kg)',
  'poids-6kg': 'Lancer de poids (6kg)',
  'poids-5kg': 'Lancer de poids (5kg)',
  'poids-4kg': 'Lancer de poids (4kg)',
  'poids-3kg': 'Lancer de poids (3kg)',
  'poids-2kg': 'Lancer de poids (2kg)',
  'disque-2kg': 'Lancer de disque (2kg)',
  'disque-1.5kg': 'Lancer de disque (1,5kg)',
  'disque-1kg': 'Lancer de disque (1kg)',
  'disque-750g': 'Lancer de disque (750g)',
  'disque-500g': 'Lancer de disque (500g)',
  'javelot-800g': 'Lancer de javelot (800g)',
  'javelot-700g': 'Lancer de javelot (700g)',
  'javelot-600g': 'Lancer de javelot (600g)',
  'javelot-500g': 'Lancer de javelot (500g)',
  'marteau-7kg': 'Lancer de marteau (7kg)',
  'marteau-6kg': 'Lancer de marteau (6kg)',
  'marteau-5kg': 'Lancer de marteau (5kg)',
  'marteau-4kg': 'Lancer de marteau (4kg)',
  'marteau-3kg': 'Lancer de marteau (3kg)',
  '60m-haies-107cm': '60m haies (107cm)',
  '60m-haies-99cm': '60m haies (99cm)',
  '60m-haies-91cm': '60m haies (91cm)',
  '60m-haies-84cm': '60m haies (84cm)',
  '60m-haies-76cm': '60m haies (76cm)',
  '110m-haies-107cm': '110m haies (107cm)',
  '100m-haies-84cm': '100m haies (84cm)',
  '400m-haies-91cm': '400m haies (91cm)',
  '400m-haies-76cm': '400m haies (76cm)',
  '80m-haies-76cm': '80m haies (76cm)',
}
Object.assign(DISCIPLINE_LABELS, DISCIPLINE_VARIANT_LABELS)

/** Disciplines de relais proposées à la création d'une équipe. */
export const TEAM_RELAY_DISCIPLINES = [
  { value: '4x60m', label: 'Relais 4x60' },
  { value: '4x80m', label: 'Relais 4x80' },
  { value: '4x100m', label: 'Relais 4x100' },
  { value: '4x200m', label: 'Relais 4x200' },
  { value: '4x400m', label: 'Relais 4x400' },
]

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

/**
 * Palette de couleurs vives pour les pastilles de discipline (choix Maksen).
 * Volontairement large (12, pas 5) pour qu'un athlète avec beaucoup de
 * spécialités n'ait pas de couleurs qui se répètent avant la 13e discipline
 * (correctif 2026-08-25 : avec 5 couleurs seulement, ça bouclait vite et se
 * confondait avec l'accent violet de l'appli, qui n'a plus rien d'unique).
 */
export const DEFAULT_DISCIPLINE_COLORS = [
  '#f97316',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f43f5e',
  '#eab308',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#7c3aed',
  '#f472b6',
  '#14b8a6',
]

/**
 * Couleur par défaut d'une discipline sans couleur explicitement choisie —
 * dérivée de sa position dans la liste (stable, pas un violet unique pour
 * toutes) plutôt qu'une couleur fixe qui rendait toutes les pastilles sans
 * couleur indiscernables les unes des autres.
 */
export function defaultDisciplineColor(index: number): string {
  return DEFAULT_DISCIPLINE_COLORS[index % DEFAULT_DISCIPLINE_COLORS.length]
}

/**
 * Code de base d'une discipline, en retirant le suffixe poids/hauteur de haies
 * dérivé par `refineByCategory` (lib/ffa-scraper.ts) selon la catégorie d'âge FFA
 * — ex: "110m-haies-107cm" -> "110m-haies", "poids-4kg" -> "poids". Une
 * performance FFA est enregistrée sous ce code variant, jamais sous le code de
 * spécialité choisi par l'athlète (`Athlete.disciplines`/`disciplineColors`) : sans
 * ce fallback, la couleur choisie pour la spécialité ne s'applique jamais aux
 * performances réelles de cette discipline (correctif 2026-08-26).
 */
export function baseDisciplineCode(discipline: string): string {
  return discipline.replace(/-\d+(\.\d+)?(kg|g|cm)$/, '')
}

/**
 * Épreuves standard catégorie Espoir/Senior (objectifs athlète, voir GoalForm) :
 * exclut les épreuves jeunes (50m, 600m, 50m haies, triathlon, relais réduits...)
 * qui n'ont pas de sens comme objectif pour un athlète Espoir/Senior.
 */
export type GoalDisciplineCategory = {
  key: string
  label: string
  color: string
  disciplines: Record<string, string>
}

export const GOAL_DISCIPLINE_CATEGORIES: GoalDisciplineCategory[] = [
  {
    key: 'sprints',
    label: 'Sprints',
    color: '#f97316',
    disciplines: { '60m': '60m', '100m': '100m', '200m': '200m', '400m': '400m' },
  },
  {
    key: 'demi-fond',
    label: 'Demi-fond / Fond',
    color: '#3b82f6',
    disciplines: {
      '800m': '800m',
      '1500m': '1500m',
      '3000m': '3000m',
      '5000m': '5000m',
      '10000m': '10000m',
      'Semi-marathon': 'semi-marathon',
      Marathon: 'marathon',
    },
  },
  {
    key: 'haies',
    label: 'Haies',
    color: '#a855f7',
    disciplines: {
      '60m haies': '60m-haies',
      '100m haies (F)': '100m-haies',
      '110m haies (H)': '110m-haies',
      '400m haies': '400m-haies',
    },
  },
  { key: 'sauts', label: 'Sauts', color: '#10b981', disciplines: ATHLETE_SPECIALTIES.Sauts },
  { key: 'lancers', label: 'Lancers', color: '#f43f5e', disciplines: ATHLETE_SPECIALTIES.Lancers },
  {
    key: 'combinees',
    label: 'Épreuves combinées',
    color: '#eab308',
    disciplines: { Décathlon: 'decathlon', Heptathlon: 'heptathlon' },
  },
  {
    key: 'autres',
    label: 'Autres',
    color: '#06b6d4',
    disciplines: {
      'Cross country': 'cross',
      Marche: 'marche',
      'Relais 4x100': '4x100m',
      'Relais 4x400': '4x400m',
    },
  },
]

/** Couleur de la catégorie (sprint, sauts, relais...) à laquelle appartient une discipline. */
export function goalDisciplineColor(discipline: string): string {
  const category = GOAL_DISCIPLINE_CATEGORIES.find((c) =>
    Object.values(c.disciplines).includes(discipline)
  )
  return category?.color ?? '#6366f1'
}

const DISTANCE_DISCIPLINES = new Set(['longueur', 'hauteur', 'triple', 'perche'])
const THROW_PREFIXES = ['poids', 'disque', 'javelot', 'marteau']
const POINTS_DISCIPLINES = new Set(['decathlon', 'heptathlon', 'pentathlon', 'triathlon'])

/** Unité attendue pour un objectif sur cette discipline : temps (s), distance (m) ou points. */
export function disciplineUnit(discipline: string): 's' | 'm' | 'pts' {
  if (POINTS_DISCIPLINES.has(discipline)) return 'pts'
  if (DISTANCE_DISCIPLINES.has(discipline) || THROW_PREFIXES.some((p) => discipline.startsWith(p)))
    return 'm'
  return 's'
}
