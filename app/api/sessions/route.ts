import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { sessionInputSchema } from '@/lib/validations/session'

export async function POST(request: Request) {
  const session = await auth()
  const roles = session?.user.roles ?? []
  if (!session || (!isCoach(roles) && !isAdmin(roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sessionInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const created = await prisma.session.create({
    data: {
      title: data.title,
      date: new Date(data.date),
      startTime: data.startTime ? new Date(`${data.date}T${data.startTime}:00`) : null,
      durationMinutes: data.durationMinutes ?? null,
      trainingTypeId: data.trainingTypeId || null,
      description: data.description ?? null,
    },
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
