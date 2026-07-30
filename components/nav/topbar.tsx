'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Topbar({ name }: { name: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Logo markClassName="size-6.5" wordmarkClassName="h-3 w-auto text-foreground" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Avatar className="size-8">
          <AvatarFallback className="text-xs bg-accent text-accent-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-destructive"
          aria-label="Se déconnecter"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
