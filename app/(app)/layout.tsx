import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'
import { ActivityPing } from '@/components/activity-ping'
import type { Role } from '@/lib/roles'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const name = session?.user.name ?? ''
  const email = session?.user.email ?? ''

  const user = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { linkedAthlete: { select: { id: true, photoUrl: true, photoConfig: true } } },
      })
    : null
  const linkedAthlete = user?.linkedAthlete
    ? {
        id: user.linkedAthlete.id,
        photoUrl: user.linkedAthlete.photoUrl,
        photoConfig: JSON.parse(user.linkedAthlete.photoConfig) as {
          zoom?: number
          x?: number
          y?: number
        },
      }
    : null

  return (
    <div className="relative flex min-h-dvh">
      <ActivityPing />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--primary) 7%, transparent), transparent)',
        }}
      />
      <Sidebar roles={roles} name={name} linkedAthlete={linkedAthlete} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* pt-[env(safe-area-inset-top)] : viewport-fit=cover (app/layout.tsx) active
            les safe-area-inset-* sur iPhone à encoche/Dynamic Island, mais rien ne les
            respectait encore — sur mobile (pas de Sidebar, main affiché directement
            sous la barre de statut système) ça poussait le contenu du haut de page
            (ex: bouton "+ Créer un vote" sur /votes) sous la zone de la barre de
            statut, injoignable au tap. Vaut 0 sur desktop/appareils sans encoche,
            aucun effet là où ce n'est pas nécessaire (correctif 2026-09-09). */}
        <main className="flex-1 pt-[env(safe-area-inset-top)] pb-24 lg:pt-0 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav roles={roles} name={name} email={email} linkedAthlete={linkedAthlete} />
      <FeedbackWidget />
    </div>
  )
}
