import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { FeedbacksPanel } from '@/components/admin/feedbacks-panel'

export default async function AdminFeedbacksPage() {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    redirect('/dashboard')
  }

  const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } })
  const unresolved = feedbacks.filter((f) => f.status !== 'done').length

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-sm text-muted-foreground">
            {unresolved} ticket{unresolved > 1 ? 's' : ''} non résolu{unresolved > 1 ? 's' : ''}
          </p>
        </div>

        <FeedbacksPanel
          feedbacks={feedbacks.map((f) => ({
            id: f.id,
            type: f.type as 'bug' | 'suggestion',
            description: f.description,
            page: f.page,
            status: f.status as 'new' | 'in_progress' | 'done',
            authorName: f.authorName,
            authorEmail: f.authorEmail,
            adminNote: f.adminNote,
            createdAt: f.createdAt.toISOString(),
          }))}
        />
      </div>
    </PageTransition>
  )
}
