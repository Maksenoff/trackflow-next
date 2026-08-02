import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthleteDetail } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { ProfileHeader } from '@/components/athletes/profile-header'
import { ProfileTabs } from '@/components/athletes/profile-tabs'

export default async function AthleteProfilePage({ params }: { params: { id: string } }) {
  const athlete = await getAthleteDetail(params.id)
  if (!athlete) notFound()

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const isManager = isAdmin(roles) || isCoach(roles)

  let canEdit = isManager
  if (!canEdit && session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    canEdit = user?.linkedAthleteId === athlete.id
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8 xl:p-10">
        <ProfileHeader athlete={athlete} canEdit={canEdit} />
        <ProfileTabs athlete={athlete} canEdit={canEdit} />
      </div>
    </PageTransition>
  )
}
