import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'
import { Topbar } from '@/components/nav/topbar'
import type { Role } from '@/lib/roles'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const name = session?.user.name ?? ''

  return (
    <div className="flex min-h-dvh">
      <Sidebar roles={roles} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar name={name} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <MobileNav roles={roles} />
    </div>
  )
}
