import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getCustomSessionDetail } from '@/lib/calendar-data'
import { hasSessionEnded } from '@/lib/session-debrief'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { CustomSessionHeader } from '@/components/custom-sessions/custom-session-header'
import { CustomSessionBody } from '@/components/custom-sessions/custom-session-body'

/**
 * Fiche d'une séance perso — accessible uniquement à son propriétaire et au
 * staff (admin/coach), jamais aux autres athlètes (même règle de confidentialité
 * que l'onglet Séances du profil, cf. app/(app)/athletes/[id]/page.tsx). C'est
 * désormais le seul endroit où on peut la modifier (le calendrier ne fait plus
 * qu'y renvoyer).
 */
export default async function CustomSessionDetailPage({ params }: { params: { id: string } }) {
  const [detail, session] = await Promise.all([getCustomSessionDetail(params.id), auth()])
  if (!detail) notFound()

  const roles = (session?.user.roles ?? []) as Role[]
  const isStaff = isAdmin(roles) || isCoach(roles)

  let isSelf = false
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    isSelf = user?.linkedAthleteId === detail.athleteId
  }

  if (!isStaff && !isSelf) notFound()

  const isPast = hasSessionEnded(detail.date, detail.startTime, detail.durationMinutes)

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour au calendrier" href="/calendar" />

        <CustomSessionHeader
          detail={detail}
          isPast={isPast}
          isSelf={isSelf}
          showAthleteName={!isSelf}
        />
        <CustomSessionBody detail={detail} isPast={isPast} isSelf={isSelf} />
      </div>
    </PageTransition>
  )
}
