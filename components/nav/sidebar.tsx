'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { Logo } from '@/components/logo'
import { AccountMenu } from '@/components/nav/account-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { primaryRole, type Role } from '@/lib/roles'

export function Sidebar({ roles, name, email }: { roles: Role[]; name: string; email: string }) {
  const pathname = usePathname()
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 p-3 lg:block lg:w-[19rem]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-lg shadow-black/[0.08] dark:shadow-black/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-16 size-56 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex h-16 shrink-0 items-center px-5">
          <Logo markClassName="size-9" wordmarkClassName="h-4.5 w-auto text-card-foreground" />
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/12 to-primary/[0.03]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'text-muted-foreground'
                  )}
                >
                  <link.icon className="size-4" />
                </span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="relative flex items-center gap-2 border-t border-border p-3">
          <div className="min-w-0 flex-1">
            <AccountMenu name={name} email={email} primaryRole={primaryRole(roles)} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
