import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pollVoteSchema } from '@/lib/validations/poll'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const parsed = pollVoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { options: { select: { id: true } } },
  })
  if (!poll) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (!poll.options.some((o) => o.id === parsed.data.optionId)) {
    return NextResponse.json({ error: 'Option invalide.' }, { status: 400 })
  }
  if (poll.startsAt.getTime() > Date.now()) {
    return NextResponse.json({ error: "Ce vote n'a pas encore commencé." }, { status: 400 })
  }
  if (poll.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Ce vote est terminé.' }, { status: 400 })
  }

  await prisma.pollVote.upsert({
    where: { pollId_userId: { pollId: params.id, userId: session.user.id } },
    update: { optionId: parsed.data.optionId },
    create: { pollId: params.id, optionId: parsed.data.optionId, userId: session.user.id },
  })

  // Renvoie les compteurs à jour pour que le client affiche les % en direct sans
  // attendre un rechargement — évite tout écart avec les votes d'autres utilisateurs.
  const options = await prisma.pollOption.findMany({
    where: { pollId: params.id },
    select: { id: true, _count: { select: { votes: true } } },
  })
  const totalVotes = options.reduce((sum, o) => sum + o._count.votes, 0)

  return NextResponse.json({
    ok: true,
    totalVotes,
    options: options.map((o) => ({ id: o.id, votes: o._count.votes })),
  })
}
