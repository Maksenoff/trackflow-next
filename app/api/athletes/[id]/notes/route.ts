import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { noteInputSchema } from '@/lib/validations/note'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = noteInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const note = await prisma.athleteNote.create({
    data: { athleteId: params.id, ...parsed.data },
  })

  return NextResponse.json(note, { status: 201 })
}
