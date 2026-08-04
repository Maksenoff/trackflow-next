'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import type { Role } from '@/lib/roles'

export function MobileNav({ roles }: { roles: Role[] }) {
  const pathname = usePathname()
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r))).slice(
    0,
    5
  )

  return (
    <nav
      className="fixed inset-x-3 z-40 rounded-[24px] border border-border bg-card/95 shadow-lg shadow-black/10 backdrop-blur supports-backdrop-filter:bg-card/85 lg:hidden dark:shadow-black/30"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <ul className="flex items-stretch justify-around px-1 py-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className="relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground"
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'relative z-10 flex items-center justify-center',
                    isActive && 'text-primary'
                  )}
                >
                  <link.icon className="size-5" />
                </motion.span>
                <span className={cn('relative z-10', isActive && 'text-primary')}>
                  {link.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
