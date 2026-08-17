export function calcAge(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--
  return age
}

export const GENDER_LABELS: Record<string, string> = {
  M: 'Homme',
  F: 'Femme',
  X: 'Autre',
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

/** Profil athlète lié à l'utilisateur connecté, pour afficher sa vraie photo dans la nav. */
export type LinkedAthleteInfo = {
  id: string
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

/** Reproduit la logique de catégorie FFA de AthleteController::show() (âge au 31 déc) */
export function ffaCategory(
  birthDate: Date | null,
  referenceYear = new Date().getFullYear()
): string | null {
  if (!birthDate) return null
  const age = referenceYear - birthDate.getFullYear()
  if (age <= 11) return 'Poussin'
  if (age <= 13) return 'Benjamin'
  if (age <= 15) return 'Minime'
  if (age <= 17) return 'Cadet'
  if (age <= 19) return 'Junior'
  if (age <= 22) return 'Espoir'
  if (age <= 34) return 'Senior'
  return 'Master'
}

export function formatFollowedSince(createdAt: Date): string {
  return createdAt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
