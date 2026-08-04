'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { AccountMenu } from '@/components/nav/account-menu'
import { primaryRole, type Role } from '@/lib/roles'

export function Topbar({ name, email, roles }: { name: string; email: string; roles: Role[] }) {
  return (
    <header className="sticky top-3 z-30 mx-3 flex h-14 items-center justify-between rounded-[24px] border border-border bg-card/95 px-4 shadow-lg shadow-black/[0.03] backdrop-blur supports-backdrop-filter:bg-card/85 lg:hidden dark:shadow-black/30">
      <Logo markClassName="size-6.5" wordmarkClassName="h-3 w-auto text-card-foreground" />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <AccountMenu name={name} email={email} primaryRole={primaryRole(roles)} compact />
      </div>
    </header>
  )
}
