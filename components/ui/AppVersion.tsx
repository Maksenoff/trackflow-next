import Link from 'next/link'

export function AppVersion() {
  return (
    <Link
      href="/changelog"
      className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
    >
      v{process.env.NEXT_PUBLIC_APP_VERSION}
    </Link>
  )
}
