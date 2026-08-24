import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { goalInputSchema } from '@/lib/validations/goal'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; goalId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = goalInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const goal = await prisma.goal.update({
    where: { id: params.goalId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.discipline !== undefined && { discipline: data.discipline }),
      ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? new Date(data.deadline) : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.autoValidateFfa !== undefined && { autoValidateFfa: data.autoValidateFfa }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })

  return NextResponse.json(goal)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; goalId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  await prisma.goal.delete({ where: { id: params.goalId } })
  return NextResponse.json({ ok: true })
}
