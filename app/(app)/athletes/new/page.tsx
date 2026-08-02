import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { AthleteForm } from '@/components/athletes/athlete-form'

export default async function NewAthletePage() {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  if (!isAdmin(roles) && !isCoach(roles)) {
    redirect('/dashboard')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8 xl:p-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvel athlète</h1>
          <p className="text-sm text-muted-foreground">
            Renseigne le profil manuellement. L&apos;import via licence FFA arrive avec la
            synchronisation athle.fr.
          </p>
        </div>

        <AthleteForm mode="create" />
      </div>
    </PageTransition>
  )
}
