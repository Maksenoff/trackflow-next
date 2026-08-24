import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getTeamDetail } from '@/lib/teams-data'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { TeamForm } from '@/components/teams/team-form'

export default async function TeamEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const team = await getTeamDetail(params.id)
  if (!team) notFound()

  let linkedAthleteId: string | null = null
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { linkedAthleteId: true },
    })
    linkedAthleteId = user?.linkedAthleteId ?? null
  }
  const isTeamMember =
    !canManage && !!linkedAthleteId && team.members.some((m) => m.id === linkedAthleteId)

  // Seuls coach/admin et les athlètes membres de CETTE équipe peuvent éditer —
  // tout autre visiteur est renvoyé sur la fiche en lecture seule.
  if (!canManage && !isTeamMember) redirect(`/teams/${team.id}`)

  const allAthletes = canManage ? await getAthletesList() : []

  const positioned = team.members
    .filter((m) => m.relayOrder != null)
    .sort((a, b) => (a.relayOrder ?? 0) - (b.relayOrder ?? 0))
    .map((m) => ({ athlete: m, handoffMark: m.handoffMark }))
  const bench = team.members.filter((m) => m.relayOrder == null)

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] p-4 lg:p-8 xl:p-10">
        <TeamForm
          mode="edit"
          teamId={team.id}
          canManageMembers={canManage}
          initialData={{
            name: team.name,
            color: team.color,
            photoUrl: team.photoUrl,
            photoConfig: team.photoConfig,
            positioned,
            bench,
          }}
          allAthletes={allAthletes.map((a) => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            photoUrl: a.photoUrl,
            photoConfig: a.photoConfig,
            licenseNumber: a.licenseNumber,
          }))}
        />
      </div>
    </PageTransition>
  )
}
