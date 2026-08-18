import { initials } from '@/lib/athlete'

export type AthleteAvatarData = {
  firstName: string
  lastName: string
  photoUrl: string | null
  photoConfig: { zoom?: number; x?: number; y?: number }
}

export function AthleteAvatar({
  athlete,
  className = 'size-9',
}: {
  athlete: AthleteAvatarData
  className?: string
}) {
  if (athlete.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={athlete.photoUrl}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover ring-2 ring-card`}
        style={{
          objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
          transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
          transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
        }}
      />
    )
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground ring-2 ring-card`}
    >
      {initials(athlete.firstName, athlete.lastName)}
    </div>
  )
}
