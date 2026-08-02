import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthletesList } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { AthleteSearch } from '@/components/athletes/athlete-search'
import { AthleteCard } from '@/components/athletes/athlete-card'

export default async function AthletesPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const canManage = isAdmin(roles) || isCoach(roles)

  const athletes = await getAthletesList(searchParams.q)

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Athlètes</h1>
            <p className="text-sm text-muted-foreground">
              {athletes.length} athlète{athletes.length > 1 ? 's' : ''} suivi
              {athletes.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AthleteSearch />
            {canManage && (
              <Link
                href="/athletes/new"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                Nouvel athlète
              </Link>
            )}
          </div>
        </div>

        {athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
            <Users className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {searchParams.q
                ? 'Aucun athlète ne correspond à cette recherche.'
                : 'Aucun athlète pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {athletes.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
