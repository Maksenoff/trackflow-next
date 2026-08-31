import Link from 'next/link'

export function AppVersion() {
  return (
    <Link
      href="/changelog"
      className="text-[11px] text-muted-foreground/70 underline decoration-dotted underline-offset-2 transition-colors hover:text-muted-foreground"
    >
      TrackFlow {process.env.NEXT_PUBLIC_APP_VERSION}
    </Link>
  )
}
