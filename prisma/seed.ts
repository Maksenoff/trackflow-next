import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(18, 0, 0, 0)
  return d
}

async function main() {
  const password = await bcrypt.hash('password', 10)

  const speedType = await prisma.trainingType.create({
    data: { name: 'Vitesse', color: '#6366f1' },
  })
  const enduranceType = await prisma.trainingType.create({
    data: { name: 'Endurance', color: '#22d3ee' },
  })

  const meetingType = await prisma.competitionType.create({
    data: { name: 'Meeting', color: '#f59e0b' },
  })
  const champType = await prisma.competitionType.create({
    data: { name: 'Championnat', color: '#ef4444' },
  })

  const athlete1 = await prisma.athlete.create({
    data: {
      firstName: 'Léa',
      lastName: 'MARTIN',
      gender: 'F',
      birthDate: new Date('2005-03-14'),
      disciplines: JSON.stringify(['100m', '200m']),
      licenseNumber: '1234567',
    },
  })
  const athlete2 = await prisma.athlete.create({
    data: {
      firstName: 'Noah',
      lastName: 'DUBOIS',
      gender: 'M',
      birthDate: new Date('2003-07-22'),
      disciplines: JSON.stringify(['longueur', '110m-haies']),
      licenseNumber: '7654321',
    },
  })

  const coach = await prisma.user.create({
    data: {
      email: 'coach@trackflow.app',
      firstName: 'Marie',
      lastName: 'Coach',
      password,
      roles: JSON.stringify(['ROLE_ADMIN', 'ROLE_COACH']),
    },
  })

  await prisma.user.create({
    data: {
      email: 'athlete@trackflow.app',
      firstName: 'Léa',
      lastName: 'Martin',
      password,
      roles: JSON.stringify(['ROLE_ATHLETE']),
      linkedAthleteId: athlete1.id,
    },
  })

  const sessionToday = await prisma.session.create({
    data: {
      title: 'Séance sprint court',
      date: daysFromNow(0),
      trainingTypeId: speedType.id,
      description: '4x60m départ blocs + gammes',
      durationMinutes: 90,
    },
  })
  await prisma.session.create({
    data: {
      title: 'Footing récupération',
      date: daysFromNow(2),
      trainingTypeId: enduranceType.id,
      description: '40min allure libre',
      durationMinutes: 40,
    },
  })
  await prisma.session.create({
    data: {
      title: 'Musculation + PPG',
      date: daysFromNow(4),
      trainingTypeId: speedType.id,
      durationMinutes: 60,
    },
  })

  await prisma.athleteSession.create({
    data: {
      athleteId: athlete1.id,
      sessionId: sessionToday.id,
      difficulty: 7,
      comment: 'Bonnes sensations',
    },
  })

  const comp1 = await prisma.competition.create({
    data: {
      title: 'Meeting régional indoor',
      location: 'Liévin',
      date: daysFromNow(6),
      competitionTypeId: meetingType.id,
    },
  })
  await prisma.competition.create({
    data: {
      title: 'Championnat départemental',
      location: 'Lille',
      date: daysFromNow(20),
      competitionTypeId: champType.id,
    },
  })

  await prisma.competitionRegistration.create({
    data: {
      athleteId: athlete1.id,
      competitionId: comp1.id,
      disciplines: JSON.stringify(['100m']),
      ffaRegistered: true,
    },
  })

  // Performances — historique + saison en cours pour tester PB/SB/trend
  await prisma.performance.createMany({
    data: [
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.45,
        unit: 's',
        recordedAt: new Date('2025-06-10'),
        isPersonalBest: false,
        isCompetition: true,
      },
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.31,
        unit: 's',
        recordedAt: daysFromNow(-10),
        isPersonalBest: true,
        isCompetition: true,
      },
      {
        athleteId: athlete1.id,
        discipline: '200m',
        value: 25.8,
        unit: 's',
        recordedAt: daysFromNow(-3),
        isPersonalBest: false,
        isCompetition: false,
      },
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.42,
        unit: 'm',
        recordedAt: new Date('2025-05-01'),
        isPersonalBest: false,
        isCompetition: true,
      },
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.61,
        unit: 'm',
        recordedAt: daysFromNow(-5),
        isPersonalBest: true,
        isCompetition: true,
      },
    ],
  })

  console.log('Seed terminé.')
  console.log('Coach: coach@trackflow.app / password')
  console.log('Athlète: athlete@trackflow.app / password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
