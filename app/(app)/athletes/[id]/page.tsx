import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, resolveNewUi, type Role } from '@/lib/roles'
import { getAthleteDetail } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { ProfileHeader } from '@/components/athletes/profile-header'
import { ProfileTabs } from '@/components/athletes/profile-tabs'
import { NewProfileHeader } from '@/components/new-ui/new-profile-header'
import { NewProfileTabs } from '@/components/new-ui/new-profile-tabs'
import { NewBackButton } from '@/components/new-ui/new-back-button'

export default async function AthleteProfilePage({ params }: { params: { id: string } }) {
  const [athlete, session] = await Promise.all([getAthleteDetail(params.id), auth()])
  if (!athlete) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  const isManager = isAdmin(roles) || isCoach(roles)
  // Une seule requête pour les deux champs (avant : deux `findUnique` distincts
  // sur le même `session.user.id` — retour Maksen, minimiser les chargements).
  const currentUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { newUiEnabled: true, linkedAthleteId: true },
      })
    : null
  const newUiEnabled = resolveNewUi(currentUser?.newUiEnabled, roles)
  const isSelf = currentUser?.linkedAthleteId === athlete.id

  // canEdit : gère séances/compétitions/objectifs de l'athlète (coach inclus, et
  // l'athlète pour son propre profil).
  const canEdit = isManager || isSelf
  // canEditProfile : modifie le profil lui-même (identité/photo/bannière/spécialités)
  // — réservé à l'admin, ou à l'athlète pour son propre profil.
  const canEditProfile = isAdmin(roles) || isSelf
  // canSeeNotes : les notes coach sont privées — jamais visibles par l'athlète lui-même
  // (même sur son propre profil) ni par un gest. compétitions, seulement admin/coach.
  const canSeeNotes = isManager
  // canSeeCustomSessions : les séances perso sont privées — seuls l'athlète propriétaire
  // et le staff (admin/coach) les voient. N'importe quel compte pouvait sinon consulter
  // le profil de n'importe quel athlète (aucun garde-fou de rôle sur cette page) et lire
  // le journal perso d'un autre athlète via l'onglet Séances.
  const canSeeCustomSessions = isManager || isSelf

  // Les notes/séances perso ne doivent même pas atteindre le navigateur si le viewer
  // n'a pas le droit de les voir (sinon elles restent lisibles dans le payload RSC —
  // tout composant client recevant `athlete` en prop sérialise l'objet entier, qu'il
  // affiche ou non ces champs ; ProfileHeader ET ProfileTabs doivent donc recevoir
  // cette même version assainie, pas seulement celui qui affiche l'onglet).
  const safeAthlete = {
    ...athlete,
    notesList: canSeeNotes ? athlete.notesList : [],
    customSessions: canSeeCustomSessions ? athlete.customSessions : [],
  }

  if (newUiEnabled) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1600px] p-4 pb-24 lg:p-8 lg:pb-10 xl:p-10">
          <NewBackButton label="Retour aux athlètes" />
          <NewProfileHeader
            athlete={safeAthlete}
            canEdit={canEdit}
            canEditProfile={canEditProfile}
            isAdmin={isAdmin(roles)}
          />
          <NewProfileTabs athlete={safeAthlete} canEdit={canEdit} canSeeNotes={canSeeNotes} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour aux athlètes" />
        <ProfileHeader
          athlete={safeAthlete}
          canEdit={canEdit}
          canEditProfile={canEditProfile}
          isAdmin={isAdmin(roles)}
        />
        <ProfileTabs athlete={safeAthlete} canEdit={canEdit} canSeeNotes={canSeeNotes} />
      </div>
    </PageTransition>
  )
}
