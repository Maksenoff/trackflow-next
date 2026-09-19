import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MAX_DISTANCE } from '@/lib/pace-calculator'

/** Calculateur d'allure — mémoire personnelle au compte connecté (pas à un
 * profil Athlete), accessible à tout le monde (cf. lib/pace-calculator.ts). */

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [references, user] = await Promise.all([
    prisma.paceReference.findMany({
      where: { userId: session.user.id },
      orderBy: { distance: 'asc' },
      select: { distance: true, timeSeconds: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { paceCalculatorPercent: true },
    }),
  ])
  return NextResponse.json({ references, percent: user?.paceCalculatorPercent ?? null })
}

/** Met à jour uniquement le dernier % d'allure utilisé — séparé de PUT
 * (qui upsert un temps repère par distance) car le % n'est pas propre à une
 * distance, juste une dernière valeur globale (cf. schema.prisma). */
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const percent = Number(body?.percent)
  if (!Number.isFinite(percent) || percent <= 0) {
    return NextResponse.json({ error: 'Pourcentage invalide.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { paceCalculatorPercent: percent },
  })
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const distance = Number(body?.distance)
  const timeSeconds = Number(body?.timeSeconds)
  if (
    !Number.isFinite(distance) ||
    distance <= 0 ||
    distance > MAX_DISTANCE ||
    !Number.isFinite(timeSeconds) ||
    timeSeconds <= 0
  ) {
    return NextResponse.json({ error: 'Distance ou temps invalide.' }, { status: 400 })
  }

  const reference = await prisma.paceReference.upsert({
    where: { userId_distance: { userId: session.user.id, distance } },
    create: { userId: session.user.id, distance, timeSeconds },
    update: { timeSeconds },
    select: { distance: true, timeSeconds: true },
  })
  return NextResponse.json({ reference })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Reset complet : temps repère ET dernier % utilisé (retour Maksen
  // 2026-09-20 — "tout se mémorise", donc "Réinitialiser" doit tout effacer).
  await Promise.all([
    prisma.paceReference.deleteMany({ where: { userId: session.user.id } }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { paceCalculatorPercent: null },
    }),
  ])
  return NextResponse.json({ ok: true })
}
