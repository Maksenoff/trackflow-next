'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { Logo } from '@/components/logo'
import { AccountMenu } from '@/components/nav/account-menu'
import { primaryRole, type Role } from '@/lib/roles'

export function Sidebar({ roles, name, email }: { roles: Role[]; name: string; email: string }) {
  const pathname = usePathname()
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))

  return (
    <aside className="sticky top-0 hidden h-dvh lg:flex lg:w-72 lg:shrink-0 lg:flex-col">
      <div className="relative flex h-dvh flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex h-18 shrink-0 items-center px-6">
          <Logo markClassName="size-10" wordmarkClassName="h-5 w-auto text-sidebar-foreground" />
        </div>

        <nav className="relative flex-1 space-y-1 px-3 py-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-primary/15 bg-sidebar-accent shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <link.icon className={cn('relative z-10 size-4.5', isActive && 'text-primary')} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="relative border-t border-border p-3">
          <AccountMenu name={name} email={email} primaryRole={primaryRole(roles)} />
        </div>
      </div>
    </aside>
  )
}
