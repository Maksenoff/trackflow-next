import { prisma } from '@/lib/prisma'

export type PollStatus = 'scheduled' | 'active' | 'expired'

export async function getPollsList(userId: string) {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      options: {
        include: {
          votes: { select: { id: true } },
        },
      },
      votes: { where: { userId }, select: { optionId: true } },
    },
  })

  const now = Date.now()

  return polls.map((p) => {
    const status: PollStatus =
      p.startsAt.getTime() > now ? 'scheduled' : p.expiresAt.getTime() <= now ? 'expired' : 'active'
    const expired = status === 'expired'
    const myVote = p.votes[0]?.optionId ?? null
    const totalVotes = p.options.reduce((sum, o) => sum + o.votes.length, 0)
    // Résultats masqués tant que le vote est actif ET que l'utilisateur n'a pas voté —
    // visibles dès qu'il a voté (même avant l'expiration), ou pour tout le monde une fois expiré.
    const showResults = expired || myVote !== null

    return {
      id: p.id,
      createdAt: p.createdAt,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt,
      status,
      myVote,
      totalVotes,
      options: p.options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: showResults ? o.votes.length : null,
      })),
    }
  })
}
