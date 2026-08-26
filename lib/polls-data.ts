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
    const myVote = p.votes[0]?.optionId ?? null
    const totalVotes = p.options.reduce((sum, o) => sum + o.votes.length, 0)

    return {
      id: p.id,
      createdAt: p.createdAt,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt,
      status,
      myVote,
      totalVotes,
      // Résultats toujours visibles, même avant d'avoir voté soi-même — correctif
      // 2026-08-27 : le masquage tant que non-voté empêchait de voir les votes des
      // autres, jugé confus plutôt qu'utile.
      options: p.options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: o.votes.length,
      })),
    }
  })
}
