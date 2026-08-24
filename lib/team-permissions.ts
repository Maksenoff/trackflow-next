import { prisma } from '@/lib/prisma'

/**
 * Un athlète présent dans l'équipe peut modifier les données de relais (ordre,
 * marques, historique, photo, couleur) sans être coach/admin — décision explicite
 * du propriétaire du projet. Reste réservé à coach/admin : ajout/retrait de
 * membres et suppression de l'équipe.
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { linkedAthleteId: true },
  })
  if (!user?.linkedAthleteId) return false

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_athleteId: { teamId, athleteId: user.linkedAthleteId } },
  })
  return !!membership
}
