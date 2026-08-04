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

export function hasRole(userRoles: string[] | undefined, role: Role): boolean {
  return !!userRoles?.includes(role)
}

export function isAdmin(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, ROLES.ADMIN)
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
