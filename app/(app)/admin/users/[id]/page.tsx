import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { UserEditForm } from '@/components/admin/user-edit-form'

export default async function AdminUserEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    redirect('/dashboard')
  }

  const [user, athletes] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.id } }),
    prisma.athlete.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    }),
  ])

  if (!user) {
    notFound()
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <UserEditForm
          user={{
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roles: JSON.parse(user.roles) as Role[],
            linkedAthleteId: user.linkedAthleteId,
          }}
          athletes={athletes}
          isSelf={user.id === session?.user.id}
        />
      </div>
    </PageTransition>
  )
}
