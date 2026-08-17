import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { UserCard } from '@/components/admin/user-card'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({ orderBy: { lastName: 'asc' } })

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} compte{users.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user, index) => (
            <UserCard
              key={user.id}
              user={{
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roles: JSON.parse(user.roles) as Role[],
                disabled: user.disabled,
              }}
              isSelf={user.id === session?.user.id}
              index={index}
            />
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
