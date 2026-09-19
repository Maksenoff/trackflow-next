export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  COACH: 'ROLE_COACH',
  COMPETITION_MANAGER: 'ROLE_COMPETITION_MANAGER',
  ATHLETE: 'ROLE_ATHLETE',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.COACH]: 'Coach',
  [ROLES.COMPETITION_MANAGER]: 'Gest. compétitions',
  [ROLES.ATHLETE]: 'Athlète',
}

export const ROLE_COLORS: Record<Role, string> = {
  [ROLES.ADMIN]: '#f43f5e',
  [ROLES.COACH]: '#6366f1',
  [ROLES.COMPETITION_MANAGER]: '#f59e0b',
  [ROLES.ATHLETE]: '#10b981',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Tout (panel admin, gestion des utilisateurs, feedbacks)',
  [ROLES.COACH]: 'Gestion des athlètes, séances, calendriers et compétitions',
  [ROLES.COMPETITION_MANAGER]: 'Ajout, modification et suppression des compétitions uniquement',
  [ROLES.ATHLETE]: 'Consultation de ses propres données uniquement',
}

export const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.COACH,
  ROLES.COMPETITION_MANAGER,
  ROLES.ATHLETE,
]

export function hasRole(userRoles: string[] | undefined, role: Role): boolean {
  return !!userRoles?.includes(role)
}

export function isAdmin(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, ROLES.ADMIN)
}

/**
 * Nouvelle interface = interface par défaut pour tout le monde depuis la fin
 * de la bêta (2026-09-19, cf. app/(app)/layout.tsx) — seul un admin ayant
 * explicitement mis `User.newUiEnabled` à `false` voit encore l'ancienne.
 * Centralisé ici car cette règle doit être appliquée identiquement partout où
 * une page relit ce champ pour choisir son propre rendu (dashboard, athlètes,
 * équipes...) — le passage en "défaut pour tous" n'avait initialement touché
 * que le shell, laissant 8 pages avec `if (newUiEnabled)` sur la valeur brute
 * (donc encore classique par défaut pour un compte non-admin, sous un shell
 * pourtant déjà nouvelle interface — bug constaté 2026-09-19).
 */
export function resolveNewUi(
  rawNewUiEnabled: boolean | null | undefined,
  userRoles: string[] | undefined
): boolean {
  return !(isAdmin(userRoles) && rawNewUiEnabled === false)
}

export function isCoach(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, ROLES.COACH)
}

export function isAthlete(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, ROLES.ATHLETE)
}

export function isCompetitionManager(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, ROLES.COMPETITION_MANAGER)
}

const ROLE_PRIORITY: Role[] = [ROLES.ADMIN, ROLES.COACH, ROLES.COMPETITION_MANAGER, ROLES.ATHLETE]

/** Rôle le plus "élevé" à afficher quand un seul doit être montré (ex: carte compte). */
export function primaryRole(userRoles: string[] | undefined): Role | null {
  return ROLE_PRIORITY.find((r) => userRoles?.includes(r)) ?? null
}
