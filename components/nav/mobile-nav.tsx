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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              >
                <motion.span
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn('flex items-center justify-center', isActive && 'text-primary')}
                >
                  <link.icon className="size-5" />
                </motion.span>
                <span className={cn(isActive && 'text-primary')}>{link.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
