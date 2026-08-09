import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { TypeManager } from '@/components/admin/type-manager'

export default async function SessionTypesPage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  if (!isAdmin(roles)) redirect('/dashboard')

  const types = await prisma.trainingType.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { sessions: true } } },
  })

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8 xl:p-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Types de séances</h1>
          <p className="text-sm text-muted-foreground">
            Gère les catégories (couleur + nom) utilisées dans le calendrier des entraînements.
          </p>
        </div>

        <TypeManager
          kind="session"
          initialTypes={types.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            usageCount: t._count.sessions,
          }))}
        />
      </div>
    </PageTransition>
  )
}
