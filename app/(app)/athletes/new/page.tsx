import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { NewAthleteFlow } from '@/components/athletes/new-athlete-flow'

export default async function NewAthletePage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  if (!isAdmin(roles) && !isCoach(roles)) {
    redirect('/dashboard')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour aux athlètes" />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvel athlète</h1>
          <p className="text-sm text-muted-foreground">
            Importe le profil depuis athle.fr ou renseigne-le manuellement.
          </p>
        </div>

        <NewAthleteFlow />
      </div>
    </PageTransition>
  )
}
