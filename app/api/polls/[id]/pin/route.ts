import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// Épingler un vote — admin uniquement, max 2 épinglés en même temps (demande
// explicite de Maksen le 2026-08-29). Assigne automatiquement le prochain
// créneau libre (1 = épinglé en premier, 2 = épinglé en second) ; refuse si
// les deux créneaux sont déjà pris par d'autres votes.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const poll = await prisma.poll.findUnique({ where: { id: params.id } })
  if (!poll) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
  if (poll.pinnedOrder !== null) {
    return NextResponse.json({ pinnedOrder: poll.pinnedOrder })
  }

  const pinned = await prisma.poll.findMany({
    where: { pinnedOrder: { not: null } },
    select: { pinnedOrder: true },
  })
  const taken = new Set(pinned.map((p) => p.pinnedOrder))
  const nextSlot = !taken.has(1) ? 1 : !taken.has(2) ? 2 : null
  if (nextSlot === null) {
    return NextResponse.json(
      { error: 'Deux votes sont déjà épinglés — dépingle-en un avant.' },
      { status: 400 }
    )
  }

  await prisma.poll.update({ where: { id: params.id }, data: { pinnedOrder: nextSlot } })
  return NextResponse.json({ pinnedOrder: nextSlot })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.poll.update({ where: { id: params.id }, data: { pinnedOrder: null } })
  return NextResponse.json({ ok: true })
}
