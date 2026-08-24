'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { Logo } from '@/components/logo'
import { AccountMenu } from '@/components/nav/account-menu'
import { PwaInstallButton } from '@/components/nav/pwa-install-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import type { Role } from '@/lib/roles'
import type { LinkedAthleteInfo } from '@/lib/athlete'

export function Sidebar({
  roles,
  name,
  linkedAthlete,
}: {
  roles: Role[]
  name: string
  linkedAthlete: LinkedAthleteInfo | null
}) {
  const pathname = usePathname()
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 p-3 print:hidden lg:block lg:w-[19rem]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-sidebar-border bg-sidebar shadow-lg shadow-black/[0.08] dark:shadow-black/30">
        <div className="relative flex h-16 shrink-0 items-center justify-between px-5">
          <Logo markClassName="size-9" wordmarkClassName="h-4.5 w-auto text-sidebar-foreground" />
          <NotificationBell />
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-selected shadow-sm shadow-primary/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-white/20 text-sidebar-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <link.icon className="size-5" />
                </span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="relative flex items-center gap-1 border-t border-sidebar-border p-3">
          <div className="min-w-0 flex-1">
            <AccountMenu name={name} linkedAthlete={linkedAthlete} />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <PwaInstallButton />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
