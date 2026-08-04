'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { ChevronsUpDown, LogOut, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AppVersion } from '@/components/ui/AppVersion'
import { ROLE_LABELS, type Role } from '@/lib/roles'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AccountMenu({
  name,
  email,
  primaryRole,
  compact = false,
}: {
  name: string
  email: string
  primaryRole: Role | null
  compact?: boolean
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          compact ? (
            <button type="button" aria-label="Compte">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <button
              type="button"
              className="group flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-sidebar-accent/60"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{name}</div>
                {primaryRole && (
                  <div className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[primaryRole]}
                  </div>
                )}
              </div>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-aria-expanded:rotate-180" />
            </button>
          )
        }
      />
      <DropdownMenuContent
        align={compact ? 'end' : 'start'}
        side={compact ? 'bottom' : 'top'}
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          {isDark ? 'Thème sombre' : 'Thème clair'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="size-4" />
          Se déconnecter
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-1.5 py-1">
          <AppVersion />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
