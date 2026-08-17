import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { AdminSubNav } from '@/components/admin/admin-sub-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    redirect('/dashboard')
  }

  const unresolved = await prisma.feedback.count({ where: { status: { not: 'done' } } })

  return (
    <div className="space-y-6 p-4 lg:p-8 xl:p-10">
      <AdminSubNav unresolvedFeedbacks={unresolved} />
      {children}
    </div>
  )
}
