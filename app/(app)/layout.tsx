import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'
import type { Role } from '@/lib/roles'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const name = session?.user.name ?? ''
  const email = session?.user.email ?? ''

  const user = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { linkedAthlete: { select: { id: true } } },
      })
    : null
  const linkedAthleteId = user?.linkedAthlete?.id ?? null

  return (
    <div className="relative flex min-h-dvh">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--primary) 7%, transparent), transparent)',
        }}
      />
      <Sidebar roles={roles} name={name} email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>
      <MobileNav roles={roles} name={name} email={email} linkedAthleteId={linkedAthleteId} />
    </div>
  )
}
