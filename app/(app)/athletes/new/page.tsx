import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { NewAthleteFlow } from '@/components/athletes/new-athlete-flow'

export default async function NewAthletePage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const staff = isAdmin(roles) || isCoach(roles)

  // Libre-service : un utilisateur sans rôle coach/admin et sans profil athlète déjà
  // lié à son compte peut créer le sien — même formulaire, il sera automatiquement
  // lié à son compte (cf. POST /api/athletes). Une fois lié, ce chemin se referme.
  let selfServiceAllowed = false
  if (!staff && session?.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { linkedAthleteId: true },
    })
    selfServiceAllowed = !user?.linkedAthleteId
  }

  if (!staff && !selfServiceAllowed) {
    redirect('/dashboard')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label={staff ? 'Retour aux athlètes' : 'Retour au dashboard'} />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {staff ? 'Nouvel athlète' : 'Créer mon profil athlète'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Importe le profil depuis athle.fr ou renseigne-le manuellement.
          </p>
        </div>

        <NewAthleteFlow />
      </div>
    </PageTransition>
  )
}
