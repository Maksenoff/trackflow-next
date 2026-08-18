'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronsUpDown, Download, LogOut, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function AccountMenu({
  name,
  email,
  primaryRole,
  compact = false,
  linkedAthlete,
}: {
  name: string
  email: string
  primaryRole: Role | null
  compact?: boolean
  linkedAthlete?: LinkedAthleteInfo | null
}) {
  const router = useRouter()
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt()
  const [iosDialogOpen, setIosDialogOpen] = useState(false)
  const showInstall = !isStandalone && (canInstall || isIOS)

  async function handleInstall() {
    if (canInstall) await promptInstall()
    else if (isIOS) setIosDialogOpen(true)
  }

  const avatarImage = linkedAthlete?.photoUrl && (
    <AvatarImage
      src={linkedAthlete.photoUrl}
      alt=""
      style={{
        objectPosition: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
        transform: `scale(${linkedAthlete.photoConfig.zoom ?? 1})`,
        transformOrigin: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
      }}
    />
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            compact ? (
              <button type="button" aria-label="Compte">
                <Avatar className="size-8">
                  {avatarImage}
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
                  {avatarImage}
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
          {linkedAthlete && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/athletes/${linkedAthlete.id}`)}>
                <UserRound className="size-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {showInstall && (
            <>
              <DropdownMenuItem onClick={handleInstall}>
                <Download className="size-4" />
                Installer l&apos;application
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="size-4" />
            Se déconnecter
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="flex items-center justify-between px-1.5 py-1">
            <AppVersion />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <IosInstallDialog open={iosDialogOpen} onOpenChange={setIosDialogOpen} />
    </>
  )
}
