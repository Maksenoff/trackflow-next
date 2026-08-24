import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { goalInputSchema } from '@/lib/validations/goal'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = goalInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const goal = await prisma.goal.create({
    data: {
      athleteId: params.id,
      title: data.title,
      discipline: data.discipline ?? null,
      targetValue: data.targetValue ?? null,
      unit: data.unit ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: data.status,
      autoValidateFfa: data.autoValidateFfa,
      notes: data.notes ?? null,
    },
  })

  return NextResponse.json(goal, { status: 201 })
}
