import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { feedbackCreateSchema } from '@/lib/validations/feedback'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = feedbackCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  await prisma.feedback.create({
    data: {
      type: data.type,
      description: data.description,
      page: data.page || null,
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorEmail: user.email,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const feedbacks = await prisma.feedback.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ feedbacks })
}
