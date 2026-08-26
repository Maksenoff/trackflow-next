import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthleteDetail } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { ProfileHeader } from '@/components/athletes/profile-header'
import { ProfileTabs } from '@/components/athletes/profile-tabs'

export default async function AthleteProfilePage({ params }: { params: { id: string } }) {
  const [athlete, session] = await Promise.all([getAthleteDetail(params.id), auth()])
  if (!athlete) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  const isManager = isAdmin(roles) || isCoach(roles)

  let isSelf = false
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    isSelf = user?.linkedAthleteId === athlete.id
  }

  // canEdit : gère séances/compétitions/objectifs de l'athlète (coach inclus, et
  // l'athlète pour son propre profil).
  const canEdit = isManager || isSelf
  // canEditProfile : modifie le profil lui-même (identité/photo/bannière/spécialités)
  // — réservé à l'admin, ou à l'athlète pour son propre profil.
  const canEditProfile = isAdmin(roles) || isSelf
  // canSeeNotes : les notes coach sont privées — jamais visibles par l'athlète lui-même
  // (même sur son propre profil) ni par un gest. compétitions, seulement admin/coach.
  const canSeeNotes = isManager

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour aux athlètes" />
        <ProfileHeader
          athlete={athlete}
          canEdit={canEdit}
          canEditProfile={canEditProfile}
          isAdmin={isAdmin(roles)}
        />
        <ProfileTabs
          // Les notes ne doivent même pas atteindre le navigateur si le viewer n'a pas
          // le droit de les voir (sinon elles restent lisibles dans le payload RSC
          // malgré l'onglet masqué côté UI).
          athlete={canSeeNotes ? athlete : { ...athlete, notesList: [] }}
          canEdit={canEdit}
          canSeeNotes={canSeeNotes}
        />
      </div>
    </PageTransition>
  )
}
