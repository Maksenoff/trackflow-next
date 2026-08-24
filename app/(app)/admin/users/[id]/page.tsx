import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
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

  const linkedAthlete = user.linkedAthleteId
    ? await prisma.athlete.findUnique({
        where: { id: user.linkedAthleteId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          licenseNumber: true,
          ffaProfileUrl: true,
          disciplines: true,
          videosEnabled: true,
        },
      })
    : null

  return (
    <PageTransition>
      <div className="space-y-6">
        <BackButton label="Retour aux utilisateurs" />

        <UserEditForm
          user={{
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roles: JSON.parse(user.roles) as Role[],
            linkedAthleteId: user.linkedAthleteId,
            disabled: user.disabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            lastActiveAt: user.lastActiveAt,
          }}
          athletes={athletes}
          isSelf={user.id === session?.user.id}
          linkedAthlete={
            linkedAthlete
              ? {
                  id: linkedAthlete.id,
                  firstName: linkedAthlete.firstName,
                  lastName: linkedAthlete.lastName,
                  birthDate: linkedAthlete.birthDate,
                  gender: linkedAthlete.gender,
                  licenseNumber: linkedAthlete.licenseNumber,
                  ffaProfileUrl: linkedAthlete.ffaProfileUrl,
                  disciplines: JSON.parse(linkedAthlete.disciplines) as string[],
                  videosEnabled: linkedAthlete.videosEnabled,
                }
              : null
          }
        />
      </div>
    </PageTransition>
  )
}
