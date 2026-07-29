'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppVersion } from '@/components/ui/AppVersion'
import { Button } from '@/components/ui/button'
import type { Role } from '@/lib/roles'

export function Sidebar({ roles }: { roles: Role[] }) {
  const pathname = usePathname()
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-border/60 bg-sidebar text-sidebar-foreground h-dvh sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 shrink-0">
        <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">TF</span>
        </div>
        <span className="font-semibold tracking-tight text-lg">TrackFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <link.icon className="size-4.5 relative z-10" />
              <span className="relative z-10">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between px-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-sidebar-foreground/70 hover:text-destructive"
            aria-label="Se déconnecter"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
        <div className="px-3">
          <AppVersion />
        </div>
      </div>
    </aside>
  )
}
