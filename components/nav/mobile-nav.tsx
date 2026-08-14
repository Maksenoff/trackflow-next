'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { MobileAccountSheet } from '@/components/nav/mobile-account-sheet'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { primaryRole, type Role } from '@/lib/roles'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function MobileNav({
  roles,
  name,
  email,
  linkedAthleteId,
}: {
  roles: Role[]
  name: string
  email: string
  linkedAthleteId: string | null
}) {
  const pathname = usePathname()
  const [accountOpen, setAccountOpen] = useState(false)
  const [systemOpen, setSystemOpen] = useState(false)
  const allowed = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
  const links = allowed.filter((l) => l.href !== '/settings' && l.href !== '/admin')
  const hasSystem = allowed.some((l) => l.href === '/settings' || l.href === '/admin')
  const systemActive =
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')

  return (
    <nav
      className="fixed inset-x-3 z-40 rounded-[24px] border border-border bg-card/95 shadow-lg shadow-black/10 backdrop-blur supports-backdrop-filter:bg-card/85 print:hidden lg:hidden dark:shadow-black/30"
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
        {hasSystem && (
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setSystemOpen(true)}
              className="relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground"
            >
              {systemActive && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-2xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <motion.span
                animate={{ scale: systemActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'relative z-10 flex items-center justify-center',
                  systemActive && 'text-primary'
                )}
              >
                <Settings className="size-5" />
              </motion.span>
              <span className={cn('relative z-10', systemActive && 'text-primary')}>Système</span>
            </button>
          </li>
        )}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground"
          >
            <Avatar className="size-5">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-[9px] font-bold text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span>Profil</span>
          </button>
        </li>
      </ul>

      <MobileAccountSheet
        open={accountOpen}
        onOpenChange={setAccountOpen}
        name={name}
        email={email}
        primaryRole={primaryRole(roles)}
        linkedAthleteId={linkedAthleteId}
      />

      <Sheet open={systemOpen} onOpenChange={setSystemOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Système</SheetTitle>
          <div className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full bg-muted" />

          <div className="space-y-1 px-2 pt-2 pb-2">
            <Link
              href="/settings"
              onClick={() => setSystemOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60"
            >
              <Settings className="size-4 text-muted-foreground" />
              Paramètres
            </Link>
            <Link
              href="/admin"
              onClick={() => setSystemOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60"
            >
              <ShieldCheck className="size-4 text-muted-foreground" />
              Admin
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
