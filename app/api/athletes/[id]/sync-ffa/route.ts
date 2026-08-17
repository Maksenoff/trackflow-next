import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { syncAthleteFfa } from '@/lib/ffa-scraper'

const CACHE_MINUTES = 5

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const roles = session.user.roles ?? []

  if (!isAdmin(roles) && !isCoach(roles)) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.linkedAthleteId !== params.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const body = await request.json().catch(() => ({}))
  const force = body?.force === true

  const athlete = await prisma.athlete.findUnique({ where: { id: params.id } })
  if (!athlete) return NextResponse.json({ error: 'Athlète introuvable' }, { status: 404 })

  if (!force && athlete.lastSyncedAt) {
    const cacheExpiresAt = new Date(athlete.lastSyncedAt.getTime() + CACHE_MINUTES * 60_000)
    if (cacheExpiresAt > new Date()) {
      return NextResponse.json({
        cached: true,
        imported: 0,
        skipped: 0,
        error: null,
        lastSync: athlete.lastSyncedAt.toISOString(),
      })
    }
  }

  const result = await syncAthleteFfa(params.id)

  return NextResponse.json({
    ...result,
    cached: false,
    lastSync: new Date().toISOString(),
  })
}
