import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(18, 0, 0, 0)
  return d
}

/** Crée un duel de vote complet (2 feedbacks "suggestion" + poll + options + votes). */
async function createDuel(opts: {
  labelA: string
  labelB: string
  startsAt: Date
  expiresAt: Date
  votesA: string[]
  votesB: string[]
}) {
  const feedbackA = await prisma.feedback.create({
    data: { type: 'suggestion', description: opts.labelA, status: 'done' },
  })
  const feedbackB = await prisma.feedback.create({
    data: { type: 'suggestion', description: opts.labelB, status: 'done' },
  })
  const poll = await prisma.poll.create({
    data: { startsAt: opts.startsAt, expiresAt: opts.expiresAt },
  })
  const optionA = await prisma.pollOption.create({
    data: { pollId: poll.id, feedbackId: feedbackA.id, label: opts.labelA },
  })
  const optionB = await prisma.pollOption.create({
    data: { pollId: poll.id, feedbackId: feedbackB.id, label: opts.labelB },
  })
  for (const userId of opts.votesA) {
    await prisma.pollVote.create({ data: { pollId: poll.id, optionId: optionA.id, userId } })
  }
  for (const userId of opts.votesB) {
    await prisma.pollVote.create({ data: { pollId: poll.id, optionId: optionB.id, userId } })
  }
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
      photoUrl: 'https://picsum.photos/seed/noah-trackflow/600/600',
      photoConfig: JSON.stringify({ zoom: 1.15, x: 45, y: 35 }),
      bannerUrl: 'https://picsum.photos/seed/noah-banner-trackflow/1200/400',
      bannerConfig: JSON.stringify({ mode: 'photo', zoom: 1, x: 50, y: 40 }),
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

  // Séance d'hier non debriefée par Léa -> statut "à débriefer"
  await prisma.session.create({
    data: {
      title: 'Côtes + gammes',
      date: daysFromNow(-1),
      trainingTypeId: speedType.id,
      description: '8x80m côte, récup marchée',
      durationMinutes: 60,
    },
  })
  // Séance d'il y a une semaine non debriefée par Léa -> statut "non effectuée" (auto)
  await prisma.session.create({
    data: {
      title: 'Sortie longue',
      date: daysFromNow(-7),
      trainingTypeId: enduranceType.id,
      description: '50min allure facile',
      durationMinutes: 50,
    },
  })

  const sessionPast = await prisma.session.create({
    data: {
      title: 'Séance seuil',
      date: daysFromNow(-3),
      startTime: daysFromNow(-3),
      trainingTypeId: enduranceType.id,
      description: '6x1000m allure seuil, récup 2min',
      durationMinutes: 75,
    },
  })
  await prisma.athleteSession.create({
    data: {
      athleteId: athlete1.id,
      sessionId: sessionPast.id,
      difficulty: 8,
      comment: 'Dur mais tenu le rythme jusqu’au bout',
    },
  })
  await prisma.athleteSession.create({
    data: {
      athleteId: athlete2.id,
      sessionId: sessionPast.id,
      skipped: true,
      comment: 'Absent, blessure légère',
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

  const compToDebrief = await prisma.competition.create({
    data: {
      title: 'Meeting de rentrée',
      location: 'Marquette-lez-Lille',
      date: daysFromNow(-2),
      competitionTypeId: meetingType.id,
    },
  })
  const compDebriefed = await prisma.competition.create({
    data: {
      title: 'Interclubs été',
      location: 'Villeneuve-d’Ascq',
      date: daysFromNow(-12),
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
  await prisma.competitionRegistration.create({
    data: {
      athleteId: athlete1.id,
      competitionId: compToDebrief.id,
      disciplines: JSON.stringify(['100m', '200m']),
      ffaRegistered: true,
    },
  })
  const debriefedReg = await prisma.competitionRegistration.create({
    data: {
      athleteId: athlete1.id,
      competitionId: compDebriefed.id,
      disciplines: JSON.stringify(['100m']),
      ffaRegistered: true,
    },
  })
  await prisma.competitionDebrief.create({
    data: {
      registrationId: debriefedReg.id,
      feeling: 8,
      notes: 'Bon départ, sensations solides sur toute la course.',
    },
  })

  // Performances — historique + saison en cours pour tester PB/SB/trend/graphique
  await prisma.performance.createMany({
    data: [
      // Léa — 100m
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.68,
        unit: 's',
        recordedAt: new Date('2025-05-04'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Amiens',
        level: 'IR3',
        levelPoints: 742,
        wind: '-1.2',
      },
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.45,
        unit: 's',
        recordedAt: new Date('2025-06-10'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Liévin',
        level: 'IR2',
        levelPoints: 771,
        wind: '0.4',
      },
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.52,
        unit: 's',
        recordedAt: new Date('2025-07-02'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Lille',
        level: 'IR3',
        levelPoints: 759,
        wind: '-0.8',
      },
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.38,
        unit: 's',
        recordedAt: daysFromNow(-24),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Liévin',
        level: 'IR2',
        levelPoints: 782,
        wind: '2.6',
      },
      {
        athleteId: athlete1.id,
        discipline: '100m',
        value: 12.31,
        unit: 's',
        recordedAt: daysFromNow(-10),
        isPersonalBest: true,
        isCompetition: true,
        isIndoor: false,
        venue: 'Lille',
        level: 'IR1',
        levelPoints: 796,
        wind: '1.5',
      },
      // Léa — 200m
      {
        athleteId: athlete1.id,
        discipline: '200m',
        value: 26.4,
        unit: 's',
        recordedAt: new Date('2025-06-15'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Liévin',
        level: 'IR4',
        levelPoints: 705,
      },
      {
        athleteId: athlete1.id,
        discipline: '200m',
        value: 25.8,
        unit: 's',
        recordedAt: daysFromNow(-3),
        isPersonalBest: true,
        isCompetition: false,
        isIndoor: true,
        venue: 'Salle Liévin',
        level: 'IR3',
        levelPoints: 738,
      },
      // Noah — longueur
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.18,
        unit: 'm',
        recordedAt: new Date('2025-04-12'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Arras',
        level: 'IR4',
        levelPoints: 688,
      },
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.42,
        unit: 'm',
        recordedAt: new Date('2025-05-01'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Lille',
        level: 'IR3',
        levelPoints: 719,
      },
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.35,
        unit: 'm',
        recordedAt: new Date('2025-06-08'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Liévin',
        level: 'IR3',
        levelPoints: 709,
      },
      {
        athleteId: athlete2.id,
        discipline: 'longueur',
        value: 6.61,
        unit: 'm',
        recordedAt: daysFromNow(-5),
        isPersonalBest: true,
        isCompetition: true,
        isIndoor: false,
        venue: 'Lille',
        level: 'IR2',
        levelPoints: 748,
      },
      // Noah — 110m haies
      {
        athleteId: athlete2.id,
        discipline: '110m-haies',
        value: 16.9,
        unit: 's',
        recordedAt: new Date('2025-05-20'),
        isPersonalBest: false,
        isCompetition: true,
        isIndoor: false,
        venue: 'Arras',
        level: 'IR4',
        levelPoints: 671,
      },
      {
        athleteId: athlete2.id,
        discipline: '110m-haies',
        value: 16.54,
        unit: 's',
        recordedAt: daysFromNow(-14),
        isPersonalBest: true,
        isCompetition: true,
        isIndoor: false,
        venue: 'Lille',
        level: 'IR3',
        levelPoints: 705,
      },
    ],
  })

  await prisma.podium.createMany({
    data: [
      {
        athleteId: athlete2.id,
        year: 2024,
        rank: 1,
        label: 'Champion ESM - H-F',
        level: 'Régional',
        discipline: 'Longueur',
        performance: '6m45 (+0.9)',
        recordedAt: new Date('2024-07-06'),
        venue: 'Lens',
      },
      {
        athleteId: athlete2.id,
        year: 2024,
        rank: 3,
        label: '3ème (place) ESM - H-F',
        level: 'Départemental',
        discipline: '110m haies (99)',
        performance: "14''50 (+0.8)",
        recordedAt: new Date('2024-05-18'),
        venue: 'Douai',
      },
      {
        athleteId: athlete2.id,
        year: 2023,
        rank: 2,
        label: 'Vice-champion ESM - H-F',
        level: 'Régional',
        discipline: 'Longueur',
        performance: '6m20',
        recordedAt: new Date('2023-06-24'),
        venue: 'Liévin',
      },
      {
        athleteId: athlete2.id,
        year: 2022,
        rank: 1,
        label: 'Champion JUM - H-F',
        level: 'Départemental',
        discipline: '110m haies (99)',
        performance: "14''90 (+1.1)",
        recordedAt: new Date('2022-06-11'),
        venue: 'Douai',
      },
      {
        athleteId: athlete2.id,
        year: 2021,
        rank: 3,
        label: '3ème (place) JUM - H-F',
        level: 'Départemental',
        discipline: 'Longueur',
        performance: '5m95',
        recordedAt: new Date('2021-05-15'),
        venue: 'Lens',
      },
    ],
  })

  await prisma.goal.createMany({
    data: [
      {
        athleteId: athlete1.id,
        title: 'Passer sous les 12.20 sur 100m',
        discipline: '100m',
        targetValue: 12.2,
        unit: 's',
        deadline: daysFromNow(60),
        status: 'in_progress',
      },
      {
        athleteId: athlete1.id,
        title: 'Qualification championnat régional',
        status: 'achieved',
      },
      {
        athleteId: athlete2.id,
        title: 'Franchir les 7m en longueur',
        discipline: 'longueur',
        targetValue: 7,
        unit: 'm',
        status: 'in_progress',
      },
    ],
  })

  await prisma.athleteNote.create({
    data: {
      athleteId: athlete1.id,
      title: 'Départ blocs',
      content:
        'Bien travailler la poussée sur les premiers appuis, tendance à se relever trop tôt.',
      pinned: true,
      color: 'amber',
    },
  })

  await prisma.athleteVideo.create({
    data: {
      athleteId: athlete1.id,
      title: 'Analyse départ 100m - 20/07',
      discipline: '100m',
      url: 'https://example.com/video/depart-100m',
    },
  })

  // Votes (duels) — fixtures pour couvrir les 4 états de l'onglet Votes : programmé,
  // en cours, terminé récemment (clairement tranché, pour le recap "dernier vote"),
  // terminé plus anciennement (à égalité, pour vérifier l'affichage du cas tie).
  const voters = await Promise.all(
    ['Sacha', 'Camille', 'Lucas', 'Inès', 'Tom', 'Manon'].map((firstName, i) =>
      prisma.user.create({
        data: {
          email: `voter${i + 1}@trackflow.app`,
          firstName,
          lastName: 'Voter',
          password,
          roles: JSON.stringify(['ROLE_ATHLETE']),
        },
      })
    )
  )
  const [v1, v2, v3, v4, v5, v6] = voters.map((v) => v.id)

  // Terminé il y a 1 jour, gagnant net → devient le "dernier vote" mis en avant.
  await createDuel({
    labelA: 'Tenue d’entraînement bleue',
    labelB: 'Tenue d’entraînement noire',
    startsAt: daysFromNow(-8),
    expiresAt: daysFromNow(-1),
    votesA: [coach.id, v1, v2, v3, v4],
    votesB: [v5, v6],
  })

  // Terminé il y a 10 jours, égalité parfaite → vérifie l'affichage "tie" dans la liste.
  await createDuel({
    labelA: 'Nouveau logo — version ronde',
    labelB: 'Nouveau logo — version carrée',
    startsAt: daysFromNow(-20),
    expiresAt: daysFromNow(-10),
    votesA: [coach.id, v1, v2],
    votesB: [v3, v4, v5],
  })

  // En cours — quelques votes déjà là pour un rendu "vivant", ferme dans 3 jours.
  await createDuel({
    labelA: 'Stage en bord de mer',
    labelB: 'Stage en altitude',
    startsAt: daysFromNow(-2),
    expiresAt: daysFromNow(3),
    votesA: [v1, v2, v3, v4],
    votesB: [coach.id, v5],
  })

  // Programmé, pas encore ouvert.
  await createDuel({
    labelA: 'Newsletter mensuelle',
    labelB: 'Newsletter hebdomadaire',
    startsAt: daysFromNow(2),
    expiresAt: daysFromNow(9),
    votesA: [],
    votesB: [],
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
