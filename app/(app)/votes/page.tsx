import { auth } from '@/lib/auth'
import { isAdmin, type Role } from '@/lib/roles'
import { getPollsList } from '@/lib/polls-data'
import { PageTransition } from '@/components/motion/page-transition'
import { VotesView } from '@/components/votes/votes-view'

export default async function VotesPage() {
  const session = await auth()
  const polls = await getPollsList(session!.user.id)
  const canManage = isAdmin((session!.user.roles ?? []) as Role[])

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 xl:p-10">
        <VotesView
          canManage={canManage}
          currentUserId={session!.user.id}
          polls={polls.map((p) => ({
            id: p.id,
            createdAt: p.createdAt.toISOString(),
            createdById: p.createdById,
            startsAt: p.startsAt.toISOString(),
            expiresAt: p.expiresAt.toISOString(),
            pinnedOrder: p.pinnedOrder,
            status: p.status,
            myVote: p.myVote,
            totalVotes: p.totalVotes,
            options: p.options,
          }))}
        />
      </div>
    </PageTransition>
  )
}
