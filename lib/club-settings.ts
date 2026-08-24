import { prisma } from '@/lib/prisma'

const CLUB_SETTINGS_ID = 'main'

export async function getClubSettings() {
  const settings = await prisma.clubSettings.findUnique({ where: { id: CLUB_SETTINGS_ID } })
  return { clubCode: settings?.clubCode ?? null }
}

export async function setClubCode(clubCode: string | null) {
  await prisma.clubSettings.upsert({
    where: { id: CLUB_SETTINGS_ID },
    update: { clubCode },
    create: { id: CLUB_SETTINGS_ID, clubCode },
  })
}
