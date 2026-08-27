// Script ponctuel — recalcule Performance.isPersonalBest pour tous les
// athlètes maintenant que updatePersonalBests exclut les chronos manuels
// (lib/performance.ts, isHandTimed). Corrige les PB déjà mal attribués en
// base à un chrono manuel avant ce correctif (2026-08-28).
// Usage : npx tsx prisma/scripts/fix-hand-timed-pb.ts
import { PrismaClient } from '@prisma/client'
import { updatePersonalBests } from '../../lib/ffa-scraper'

const prisma = new PrismaClient()

async function main() {
  const athletes = await prisma.athlete.findMany({ select: { id: true, firstName: true, lastName: true } })

  for (const athlete of athletes) {
    const before = await prisma.performance.findMany({
      where: { athleteId: athlete.id, isPersonalBest: true },
      select: { id: true },
    })
    await updatePersonalBests(athlete.id)
    const after = await prisma.performance.findMany({
      where: { athleteId: athlete.id, isPersonalBest: true },
      select: { id: true },
    })
    const beforeIds = new Set(before.map((p) => p.id))
    const afterIds = new Set(after.map((p) => p.id))
    const changed = beforeIds.size !== afterIds.size || [...beforeIds].some((id) => !afterIds.has(id))
    if (changed) {
      console.log(`- ${athlete.firstName} ${athlete.lastName} : PB recalculés (changement détecté)`)
    }
  }

  console.log('\nTerminé.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
