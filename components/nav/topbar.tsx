'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { AccountMenu } from '@/components/nav/account-menu'
import { primaryRole, type Role } from '@/lib/roles'

export function Topbar({ name, email, roles }: { name: string; email: string; roles: Role[] }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <Logo markClassName="size-6.5" wordmarkClassName="h-3 w-auto text-foreground" />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <AccountMenu name={name} email={email} primaryRole={primaryRole(roles)} compact />
      </div>
    </header>
  )
}
