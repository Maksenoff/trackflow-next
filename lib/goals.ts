import { prisma } from '@/lib/prisma'
import { isLowerBetter } from '@/lib/performance'

/**
 * Auto-validation des objectifs "via FFA" — appelée après chaque sync FFA
 * (lib/ffa-scraper.ts). Un objectif en cours, marqué autoValidateFfa, avec
 * discipline + targetValue renseignés, passe à "achieved" dès qu'une
 * performance de sync postérieure à sa création dépasse la cible.
 */
export async function autoValidateGoalsForAthlete(athleteId: string): Promise<void> {
  const goals = await prisma.goal.findMany({
    where: {
      athleteId,
      status: 'in_progress',
      autoValidateFfa: true,
      discipline: { not: null },
      targetValue: { not: null },
    },
  })
  if (goals.length === 0) return

  for (const goal of goals) {
    const lowerBetter = isLowerBetter(goal.unit ?? 's')
    const best = await prisma.performance.findFirst({
      where: {
        athleteId,
        discipline: goal.discipline!,
        isCompetition: true,
        recordedAt: { gt: goal.createdAt },
        value: lowerBetter ? { lte: goal.targetValue! } : { gte: goal.targetValue! },
      },
    })
    if (best) {
      await prisma.goal.update({ where: { id: goal.id }, data: { status: 'achieved' } })
    }
  }
}
