import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { fullResyncAthleteFfa } from '@/lib/ffa-scraper'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || !isAdmin(roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const athlete = await prisma.athlete.findUnique({ where: { id: params.id } })
  if (!athlete) return NextResponse.json({ error: 'Athlète introuvable' }, { status: 404 })
  if (!athlete.ffaProfileUrl) {
    return NextResponse.json({ error: 'Aucune URL FFA renseignée.' }, { status: 400 })
  }

  const result = await fullResyncAthleteFfa(params.id)

  return NextResponse.json({
    ...result,
    cached: false,
    lastSync: new Date().toISOString(),
  })
}
