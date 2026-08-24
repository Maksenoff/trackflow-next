import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { sessionInputSchema } from '@/lib/validations/session'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isCoach(roles) && !isAdmin(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sessionInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const updated = await prisma.session.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.startTime !== undefined && {
        startTime:
          data.startTime && data.date ? new Date(`${data.date}T${data.startTime}:00`) : null,
      }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.trainingTypeId !== undefined && { trainingTypeId: data.trainingTypeId || null }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.coachId !== undefined && { coachId: data.coachId || null }),
      ...(data.coachPresent !== undefined && { coachPresent: data.coachPresent }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isCoach(roles) && !isAdmin(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.session.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
