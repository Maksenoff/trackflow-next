import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { noteInputSchema } from '@/lib/validations/note'

function canManageNotes(roles: string[]) {
  return isAdmin(roles) || isCoach(roles)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (!canManageNotes(session.user.roles ?? [])) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = noteInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.pinned === true) {
    const pinnedCount = await prisma.athleteNote.count({
      where: { athleteId: params.id, pinned: true, id: { not: params.noteId } },
    })
    if (pinnedCount >= 2) {
      return NextResponse.json(
        { error: 'Maximum 2 notes épinglées. Désépingle-en une avant.' },
        { status: 400 }
      )
    }
  }

  const note = await prisma.athleteNote.update({
    where: { id: params.noteId },
    data: parsed.data,
  })

  return NextResponse.json(note)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (!canManageNotes(session.user.roles ?? [])) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.athleteNote.delete({ where: { id: params.noteId } })
  return NextResponse.json({ ok: true })
}
