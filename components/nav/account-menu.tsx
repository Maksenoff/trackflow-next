'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

// Pied de sidebar desktop : juste avatar + prénom, cliquable vers le profil
// athlète lié (plus de dropdown — thème/PWA/déconnexion sont maintenant des
// boutons à part entière juste à côté, cf. sidebar.tsx).
export function AccountMenu({
  name,
  linkedAthlete,
}: {
  name: string
  linkedAthlete?: LinkedAthleteInfo | null
}) {
  const firstName = name.split(' ')[0] || name

  const avatar = (
    <Avatar className="size-9 shrink-0">
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
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )

  if (linkedAthlete) {
    return (
      <Link
        href={`/athletes/${linkedAthlete.id}`}
        className="flex min-w-0 items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-sidebar-accent/60"
      >
        {avatar}
        <span className="truncate text-sm font-semibold">{firstName}</span>
      </Link>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5 p-1">
      {avatar}
      <span className="truncate text-sm font-semibold">{firstName}</span>
    </div>
  )
}
