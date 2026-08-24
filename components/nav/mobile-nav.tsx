'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ShieldCheck, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { MobileAccountSheet } from '@/components/nav/mobile-account-sheet'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { primaryRole, type Role } from '@/lib/roles'
import type { LinkedAthleteInfo } from '@/lib/athlete'

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
  linkedAthlete,
}: {
  roles: Role[]
  name: string
  email: string
  linkedAthlete: LinkedAthleteInfo | null
}) {
  const pathname = usePathname()
  const [accountOpen, setAccountOpen] = useState(false)
  const [systemOpen, setSystemOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const allowed = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
  const COMMUNITY_HREFS = ['/athletes', '/teams', '/votes']
  const communityLinks = allowed.filter((l) => COMMUNITY_HREFS.includes(l.href))
  const communityActive = COMMUNITY_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  )
  // Regroupe Athlètes/Équipes/Votes sous un seul bouton "Communauté" à la position
  // qu'occupait Athlètes, en conservant l'ordre des autres liens (pattern §Système).
  type RowItem = { kind: 'link'; link: (typeof allowed)[number] } | { kind: 'community' }
  const rowItems: RowItem[] = []
  let communityInserted = false
  for (const link of allowed) {
    if (link.href === '/settings' || link.href === '/admin') continue
    if (COMMUNITY_HREFS.includes(link.href)) {
      if (!communityInserted) {
        rowItems.push({ kind: 'community' })
        communityInserted = true
      }
      continue
    }
    rowItems.push({ kind: 'link', link })
  }
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
        {rowItems.map((item) => {
          if (item.kind === 'community') {
            return (
              <li key="community" className="flex-1">
                <button
                  type="button"
                  onClick={() => setCommunityOpen(true)}
                  className="relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground"
                >
                  {communityActive && (
                    <motion.span
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 rounded-2xl bg-primary/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <motion.span
                    animate={{ scale: communityActive ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cn(
                      'relative z-10 flex items-center justify-center',
                      communityActive && 'text-primary'
                    )}
                  >
                    <Users className="size-5" />
                  </motion.span>
                  <span className={cn('relative z-10', communityActive && 'text-primary')}>
                    Communauté
                  </span>
                </button>
              </li>
            )
          }
          const link = item.link
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
        <li className="flex-1">
          <NotificationBell
            variant="sheet"
            label="Alertes"
            className="mx-auto size-auto w-full flex-col gap-1 rounded-2xl py-2 text-[11px] font-medium [&_svg]:size-5"
          />
        </li>
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
              {linkedAthlete?.photoUrl && (
                <AvatarImage
                  src={linkedAthlete.photoUrl}
                  alt=""
                  style={{
                    objectPosition: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
                    transform: `scale(${linkedAthlete.photoConfig.zoom ?? 1})`,
                    transformOrigin: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
                  }}
                />
              )}
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
        linkedAthlete={linkedAthlete}
      />

      <Sheet open={communityOpen} onOpenChange={setCommunityOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Communauté</SheetTitle>
          <div className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full bg-muted" />

          <div className="grid grid-cols-3 gap-3 px-4 pt-3 pb-4">
            {communityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setCommunityOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 py-4 text-center transition-colors active:bg-primary/10"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <link.icon className="size-5" />
                </span>
                <span className="text-xs font-semibold">{link.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={systemOpen} onOpenChange={setSystemOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Système</SheetTitle>
          <div className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full bg-muted" />

          <div className="grid grid-cols-2 gap-3 px-4 pt-3 pb-4">
            {allowed.some((l) => l.href === '/settings') && (
              <Link
                href="/settings"
                onClick={() => setSystemOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 py-4 text-center transition-colors active:bg-primary/10"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Settings className="size-5" />
                </span>
                <span className="text-xs font-semibold">Paramètres</span>
              </Link>
            )}
            {allowed.some((l) => l.href === '/admin') && (
              <Link
                href="/admin"
                onClick={() => setSystemOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 py-4 text-center transition-colors active:bg-primary/10"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="text-xs font-semibold">Admin</span>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
