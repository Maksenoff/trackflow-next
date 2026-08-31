'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { Download, LogOut, Moon, Sun, UserRound } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppVersion } from '@/components/ui/AppVersion'
import { IosInstallDialog } from '@/components/pwa/ios-install-dialog'
import { useInstallPrompt } from '@/lib/use-install-prompt'
import { ROLE_LABELS, type Role } from '@/lib/roles'
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

export function MobileAccountSheet({
  open,
  onOpenChange,
  name,
  email,
  primaryRole,
  linkedAthlete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  email: string
  primaryRole: Role | null
  linkedAthlete: LinkedAthleteInfo | null
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt()
  const [iosDialogOpen, setIosDialogOpen] = useState(false)
  const showInstall = mounted && !isStandalone && (canInstall || isIOS)

  async function handleInstall() {
    if (canInstall) {
      await promptInstall()
      onOpenChange(false)
    } else if (isIOS) {
      setIosDialogOpen(true)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Mon compte</SheetTitle>
          <div className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full bg-muted" />

          <div className="flex items-center gap-3 px-4 pt-2">
            <Avatar className="size-11">
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
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {primaryRole ? ROLE_LABELS[primaryRole] : email}
              </div>
            </div>
            <div className="shrink-0 self-start pt-0.5">
              <AppVersion />
            </div>
          </div>

          <div className="space-y-1 px-2 pb-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60"
            >
              {isDark ? (
                <Moon className="size-4 text-muted-foreground" />
              ) : (
                <Sun className="size-4 text-muted-foreground" />
              )}
              {isDark ? 'Mode sombre' : 'Mode clair'}
            </button>

            {linkedAthlete && (
              <Link
                href={`/athletes/${linkedAthlete.id}`}
                onClick={() => onOpenChange(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <UserRound className="size-4 text-muted-foreground" />
                Mon profil
              </Link>
            )}

            {showInstall && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <Download className="size-4 text-muted-foreground" />
                Installer l&apos;application
              </button>
            )}

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Se déconnecter
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <IosInstallDialog open={iosDialogOpen} onOpenChange={setIosDialogOpen} />
    </>
  )
}
