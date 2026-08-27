// Script ponctuel — corrige les desync disciplines/disciplineColors déjà en
// base (couleurs orphelines après suppression d'une spécialité, ou spécialité
// ajoutée sans couleur jamais persistée). Voir reconcileDisciplineColors
// (lib/disciplines.ts), désormais appliqué systématiquement côté serveur pour
// que ce désync ne se reproduise plus — ce script ne corrige que l'existant.
// Usage : npx tsx prisma/scripts/fix-discipline-colors.ts
import { PrismaClient } from '@prisma/client'
import { reconcileDisciplineColors } from '../../lib/disciplines'

const prisma = new PrismaClient()

async function main() {
  const athletes = await prisma.athlete.findMany({
    select: { id: true, firstName: true, lastName: true, disciplines: true, disciplineColors: true },
  })

  let fixed = 0
  for (const athlete of athletes) {
    const disciplines: string[] = JSON.parse(athlete.disciplines)
    const colors: Record<string, string> = JSON.parse(athlete.disciplineColors)
    const reconciled = reconcileDisciplineColors(disciplines, colors)

    const before = JSON.stringify(colors)
    const after = JSON.stringify(reconciled)
    if (before === after) continue

    await prisma.athlete.update({
      where: { id: athlete.id },
      data: { disciplineColors: after },
    })
    fixed++
    console.log(`- ${athlete.firstName} ${athlete.lastName} : ${before} -> ${after}`)
  }

  console.log(`\n${fixed}/${athletes.length} athlètes corrigés.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
